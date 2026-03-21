import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const MODELS_DIR = path.resolve(__dirname, '../assets/models');
const TFLITE_FILE_CANDIDATES = ['MobileFaceNet.tflite'];

let initPromise;
let tfliteModel;
let tfliteNamespace;
let faceapiNamespace;
let tf;

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

const loadTfNamespace = async () => {
    if (tf) {
        return tf;
    }

    try {
        const tfNamespace = await import('@tensorflow/tfjs-node');
        tf = tfNamespace;
        return tf;
    } catch (error) {
        throw new Error(
            `Unable to load @tensorflow/tfjs-node. Install @tensorflow/tfjs-node and @tensorflow/tfjs, then restart the server. ` +
            `Original error: ${error?.message || 'Unknown error'}`
        );
    }
};

const loadTFLiteNamespace = async () => {
    if (tfliteNamespace) {
        return tfliteNamespace;
    }

    const candidates = [
        'tfjs-tflite-node',
        '@tensorflow/tfjs-tflite-node',
        '@tensorflow/tfjs-tflite',
    ];

    let lastError;
    for (const packageName of candidates) {
        try {
            tfliteNamespace = await import(packageName);
            return tfliteNamespace;
        } catch (error) {
            lastError = error;
        }
    }

    throw new Error(
        `Unable to load a TFLite runtime package (${candidates.join(', ')}). ` +
        `Install one of them and restart the server. Last error: ${lastError?.message || 'Unknown error'}`
    );
};

const loadFaceApiNamespace = async () => {
    if (faceapiNamespace) {
        return faceapiNamespace;
    }

    try {
        faceapiNamespace = await import('@vladmandic/face-api');
        return faceapiNamespace;
    } catch (error) {
        throw new Error(
            `Unable to load @vladmandic/face-api. Install it in this workspace and restart the server. ` +
            `Original error: ${error?.message || 'Unknown error'}`
        );
    }
};

const getLoadTFLiteModelFn = async () => {
    const tflite = await loadTFLiteNamespace();
    const fn = tflite?.loadTFLiteModel || tflite?.default?.loadTFLiteModel;
    if (!fn) {
        throw new Error('Loaded TFLite package does not expose loadTFLiteModel');
    }
    return fn;
};

const resolveTfliteModelPath = async () => {
    for (const modelFileName of TFLITE_FILE_CANDIDATES) {
        const candidatePath = path.join(MODELS_DIR, modelFileName);
        try {
            await fs.access(candidatePath);
            return candidatePath;
        } catch {
            continue;
        }
    }
    throw new Error(`TFLite model not found in ${MODELS_DIR}`);
};

const normalizeBox = (box, imageHeight, imageWidth) => {
    // Add 15% padding to capture the whole head, not just the inner face
    const padX = box.width * 0.15;
    const padY = box.height * 0.15;

    const x1 = clamp(box.x - padX, 0, imageWidth - 1);
    const y1 = clamp(box.y - padY, 0, imageHeight - 1);
    const x2 = clamp(box.x + box.width + padX, 1, imageWidth);
    const y2 = clamp(box.y + box.height + padY, 1, imageHeight);

    return [
        y1 / imageHeight,
        x1 / imageWidth,
        y2 / imageHeight,
        x2 / imageWidth,
    ];
};

const preprocessFaces = (imageTensor, boxes) => {
    const [imageHeight, imageWidth] = imageTensor.shape;
    const normalizedBoxes = boxes.map((box) => normalizeBox(box, imageHeight, imageWidth));

    return tf.tidy(() => {
        const boxesTensor = tf.tensor2d(normalizedBoxes, [normalizedBoxes.length, 4], 'float32');
        const batchImage = imageTensor.expandDims(0).toFloat();
        const boxIndices = tf.zeros([normalizedBoxes.length], 'int32');
        const cropped = tf.image.cropAndResize(batchImage, boxesTensor, boxIndices, [112, 112]);
        const normalized = cropped.sub(127.5).div(128);
        return normalized;
    });
};

const getOutputTensor = (output) => {
    if (output instanceof tf.Tensor) {
        return output;
    }

    if (Array.isArray(output)) {
        const tensors = output.filter((item) => item instanceof tf.Tensor);
        if (!tensors.length) {
            throw new Error('TFLite model output array does not contain a Tensor');
        }
        for (let index = 1; index < tensors.length; index += 1) {
            tensors[index].dispose();
        }
        return tensors[0];
    }

    if (output && typeof output === 'object') {
        const tensors = Object.values(output).filter((item) => item instanceof tf.Tensor);
        if (!tensors.length) {
            throw new Error('TFLite model output object does not contain a Tensor');
        }
        for (let index = 1; index < tensors.length; index += 1) {
            tensors[index].dispose();
        }
        return tensors[0];
    }

    throw new Error('Unsupported TFLite output format');
};

const runEmbeddingModel = (inputTensor) => {
    const output =
        typeof tfliteModel.predict === 'function'
            ? tfliteModel.predict(inputTensor)
            : typeof tfliteModel.execute === 'function'
                ? tfliteModel.execute(inputTensor)
                : typeof tfliteModel.infer === 'function'
                    ? tfliteModel.infer(inputTensor)
                    : null;

    if (!output) {
        throw new Error('Unable to run inference on TFLite model');
    }

    const outputTensor = getOutputTensor(output);
    const descriptorTensor = tf.tidy(() => outputTensor.reshape([-1, 128]));

    if (outputTensor !== descriptorTensor) {
        outputTensor.dispose();
    }

    return descriptorTensor;
};

const ensureModelsLoaded = async () => {
    if (initPromise) {
        await initPromise;
        return;
    }

    initPromise = (async () => {
        await loadTfNamespace();
        const faceapi = await loadFaceApiNamespace();
        await faceapi.nets.ssdMobilenetv1.loadFromDisk(MODELS_DIR);
        const loadTFLiteModel = await getLoadTFLiteModelFn();
        const tfliteModelPath = await resolveTfliteModelPath();
        tfliteModel = await loadTFLiteModel(tfliteModelPath);
    })();

    try {
        await initPromise;
    } catch (error) {
        initPromise = undefined;
        throw error;
    }
};

const generateSingleDescriptor = async (imagePath) => {
    await ensureModelsLoaded();
    const faceapi = await loadFaceApiNamespace();

    const imageBuffer = await fs.readFile(imagePath);
    const imageTensor = tf.node.decodeImage(imageBuffer, 3);

    try {
        // Add options to ensure a high-quality enrollment picture
        const options = new faceapi.SsdMobilenetv1Options({ minConfidence: 0.8 });
        const detection = await faceapi.detectSingleFace(imageTensor, options);
        if (!detection) {
            throw new Error('No face detected in the provided image');
        }

        const preprocessed = preprocessFaces(imageTensor, [detection.box]);
        let descriptorsTensor;

        try {
            descriptorsTensor = runEmbeddingModel(preprocessed);
        } finally {
            preprocessed.dispose();
        }

        try {
            const descriptor = Array.from(descriptorsTensor.dataSync());
            if (descriptor.length !== 128) {
                throw new Error(`Expected 128 descriptor values but received ${descriptor.length}`);
            }
            return descriptor;
        } finally {
            descriptorsTensor.dispose();
        }
    } finally {
        imageTensor.dispose();
    }
};

const generateGroupDescriptors = async (imagePath) => {
    await ensureModelsLoaded();
    const faceapi = await loadFaceApiNamespace();

    const imageBuffer = await fs.readFile(imagePath);
    const imageTensor = tf.node.decodeImage(imageBuffer, 3);

    try {
        // 0.5 is good for crowded classrooms where faces are smaller
        const options = new faceapi.SsdMobilenetv1Options({ minConfidence: 0.5 });
        const detections = await faceapi.detectAllFaces(imageTensor, options);
        if (!detections?.length) {
            return [];
        }

        const boxes = detections.map((detection) => detection.box);
        const preprocessedBatch = preprocessFaces(imageTensor, boxes); // Shape: [N, 112, 112, 3]

        const descriptors = [];

        tf.tidy(() => {
            const individualFaces = tf.unstack(preprocessedBatch);

            for (const face of individualFaces) {
                const singleFaceBatch = face.expandDims(0);
                const descriptorTensor = runEmbeddingModel(singleFaceBatch);

                const rawArray = Array.from(descriptorTensor.dataSync());
                descriptors.push(rawArray);

                descriptorTensor.dispose();
            }
        });

        preprocessedBatch.dispose();
        return descriptors;

    } finally {
        imageTensor.dispose();
    }
};

export {
    generateSingleDescriptor,
    generateGroupDescriptors,
};
