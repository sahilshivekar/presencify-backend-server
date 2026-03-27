import { InferenceSession, Tensor } from 'onnxruntime-node';
import { Jimp } from 'jimp';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 👉 Models
const detectorModelPath = path.join(__dirname, '../assets/models/blaze.onnx');
const recognizerModelPath = path.join(__dirname, '../assets/models/face_recognition_sface_2021dec.onnx');

let detectorSession = null;
let recognizerSession = null;

const initializeModels = async () => {
    if (!detectorSession) {
        detectorSession = await InferenceSession.create(detectorModelPath);
    }
    if (!recognizerSession) {
        recognizerSession = await InferenceSession.create(recognizerModelPath);
    }
};

// 🔹 Image → Tensor (BlazeFace expects RGB normalized, NCHW)
// 🔹 1. BlazeFace Expects: RGB Order, Normalized to [-1.0, 1.0]
const imageToBlazeTensor = (image) => {
    const { width, height, data } = image.bitmap;
    const size = width * height;
    const floatData = new Float32Array(3 * size);

    for (let i = 0; i < data.length; i += 4) {
        // Normalize to [-1, 1]
        const r = (data[i] / 127.5) - 1.0;
        const g = (data[i + 1] / 127.5) - 1.0;
        const b = (data[i + 2] / 127.5) - 1.0;

        const pixelIndex = i / 4;
        floatData[pixelIndex] = r;
        floatData[size + pixelIndex] = g;
        floatData[size * 2 + pixelIndex] = b;
    }
    return new Tensor('float32', floatData, [1, 3, height, width]);
};

// 🔹 2. SFace Expects: BGR Order, Raw Pixels [0.0, 255.0] (NO DIVISION)
const imageToSFaceTensor = (image) => {
    const { width, height, data } = image.bitmap;
    const size = width * height;
    const floatData = new Float32Array(3 * size);

    for (let i = 0; i < data.length; i += 4) {
        const r = data[i];     // DO NOT DIVIDE BY 255
        const g = data[i + 1];
        const b = data[i + 2];

        const pixelIndex = i / 4;
        // BGR ORDER: Blue first, Green second, Red third
        floatData[pixelIndex] = b;
        floatData[size + pixelIndex] = g;
        floatData[size * 2 + pixelIndex] = r;
    }
    return new Tensor('float32', floatData, [1, 3, height, width]);
};

// 🔹 Decode BlazeFace output (simple + stable)
const extractFace = (outputs) => {
    const boxes = outputs[0].data;
    if (boxes.length === 0) return null;

    let x1 = boxes[0];
    let y1 = boxes[1];
    let x2 = boxes[2];
    let y2 = boxes[3];

    // FIX: If BlazeFace gives pixels (e.g., 45.0) instead of decimals (0.45)
    // divide by the detection size (128) to normalize them to 0.0 - 1.0
    if (x2 > 1.0 || y2 > 1.0) {
        x1 /= 128.0;
        y1 /= 128.0;
        x2 /= 128.0;
        y2 /= 128.0;
    }

    const w = x2 - x1;
    const h = y2 - y1;

    return { x: x1, y: y1, w, h };
};

// 🔹 Crop (consistent across all platforms)
const alignAndCrop = async (image, face) => {
    const imgW = image.bitmap.width;
    const imgH = image.bitmap.height;

    let { x, y, w, h } = face;

    x *= imgW;
    y *= imgH;
    w *= imgW;
    h *= imgH;

    let cx = x + w / 2;
    let cy = y + h / 2;

    let size = Math.max(w, h);
    size *= 1.4;

    let newX = Math.max(0, cx - size / 2);
    let newY = Math.max(0, cy - size / 2);

    size = Math.min(size, imgW - newX, imgH - newY);

    const cropped = image.clone();

    await cropped.crop({
        x: Math.round(newX),
        y: Math.round(newY),
        w: Math.round(size),
        h: Math.round(size)
    });

    await cropped.resize({
        w: 112,
        h: 112
    });

    return cropped;
};

const generateSingleDescriptor = async (imagePath) => {
    await initializeModels();

    // 🔹 1. Read image
    const image = await Jimp.read(imagePath);

    // 🔹 2. Resize
    const DETECT_SIZE = 128;
    const resized = image.clone().resize({
        w: DETECT_SIZE,
        h: DETECT_SIZE
    });

    const inputTensor = imageToBlazeTensor(resized);


    // 🔹 4. Run detection
    const detectorFeeds = {
        image: inputTensor,
        conf_threshold: new Tensor('float32', Float32Array.from([0.75]), [1]),
        iou_threshold: new Tensor('float32', Float32Array.from([0.3]), [1]),
        max_detections: new Tensor('int64', BigInt64Array.from([1n]), [1])
    };

    const detectorResults = await detectorSession.run(detectorFeeds);


    const outputs = Object.values(detectorResults);

    // 🔹 5. Extract face
    const face = extractFace(outputs);

    if (!face) {
        throw new Error("No face detected");
    }

    // 🔹 6. Crop
    const cropped = await alignAndCrop(image, face);

    // 🔹 7. Recognition
    const recognizerTensor = imageToSFaceTensor(cropped);


    const recognizerFeeds = {
        [recognizerSession.inputNames[0]]: recognizerTensor
    };

    const recognizerResults = await recognizerSession.run(recognizerFeeds);

    const embedding = recognizerResults[recognizerSession.outputNames[0]].data;


    // 🔹 8. Normalize
    const norm = Math.sqrt(embedding.reduce((sum, v) => sum + v * v, 0));
    const normalized = Array.from(embedding).map(v => v / norm);


    return normalized;
};

export { generateSingleDescriptor };