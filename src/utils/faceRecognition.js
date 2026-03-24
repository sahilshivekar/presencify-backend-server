import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

import * as blazeface from '@tensorflow-models/blazeface';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let initPromise;
let tf;
let detector;

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

const loadTfNamespace = async () => {
    if (tf) return tf;

    const tfNamespace = await import('@tensorflow/tfjs');
    await import('@tensorflow/tfjs-backend-wasm');

    tf = tfNamespace;

    await tf.setBackend('wasm');
    await tf.ready();

    console.log('Using TensorFlow backend:', tf.getBackend());

    return tf;
};

const loadDetector = async () => {
    if (detector) return detector;
    detector = await blazeface.load();
    return detector;
};

const ensureModelsLoaded = async () => {
    if (initPromise) return initPromise;

    initPromise = (async () => {
        await loadTfNamespace();
        await loadDetector();
    })();

    return initPromise;
};

const decodeImage = async (imageBuffer) => {
    const { decode } = await import('jpeg-js');

    const raw = decode(imageBuffer, { useTArray: true });

    return tf.tensor3d(raw.data, [raw.height, raw.width, 4])
        .slice([0, 0, 0], [-1, -1, 3]);
};

const detectFaces = async (imageTensor) => {
    const model = await loadDetector();
    const predictions = await model.estimateFaces(imageTensor, false);

    return predictions.map((p) => ({
        x: p.topLeft[0],
        y: p.topLeft[1],
        width: p.bottomRight[0] - p.topLeft[0],
        height: p.bottomRight[1] - p.topLeft[1],
    }));
};

const normalizeBox = (box, imageHeight, imageWidth) => {
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

    const normalizedBoxes = boxes.map((box) =>
        normalizeBox(box, imageHeight, imageWidth)
    );

    return tf.tidy(() => {
        const boxesTensor = tf.tensor2d(normalizedBoxes);
        const batchImage = imageTensor.expandDims(0).toFloat();
        const boxIndices = tf.zeros([normalizedBoxes.length], 'int32');

        const cropped = tf.image.cropAndResize(
            batchImage,
            boxesTensor,
            boxIndices,
            [112, 112]
        );

        return cropped.div(255); // normalize
    });
};

const generateEmbedding = (faceTensor) => {
    return tf.tidy(() => {
        const resized = tf.image.resizeBilinear(faceTensor, [64, 64]);
        const flattened = resized.flatten();

        const embedding = flattened.slice([0], [128]);

        return Array.from(embedding.dataSync());
    });
};

const generateSingleDescriptor = async (imagePath) => {
    await ensureModelsLoaded();

    const imageBuffer = await fs.readFile(imagePath);
    const imageTensor = await decodeImage(imageBuffer);

    try {
        const faces = await detectFaces(imageTensor);

        if (!faces.length) {
            throw new Error('No face detected');
        }

        const preprocessed = preprocessFaces(imageTensor, [faces[0]]);
        const face = tf.squeeze(preprocessed);

        const descriptor = generateEmbedding(face);

        preprocessed.dispose();
        face.dispose();

        return descriptor;

    } finally {
        imageTensor.dispose();
    }
};

const generateGroupDescriptors = async (imagePath) => {
    await ensureModelsLoaded();

    const imageBuffer = await fs.readFile(imagePath);
    const imageTensor = await decodeImage(imageBuffer);

    try {
        const faces = await detectFaces(imageTensor);
        if (!faces.length) return [];

        const preprocessedBatch = preprocessFaces(imageTensor, faces);
        const individualFaces = tf.unstack(preprocessedBatch);

        const descriptors = [];

        for (const face of individualFaces) {
            const descriptor = generateEmbedding(face);
            descriptors.push(descriptor);
            face.dispose();
        }

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