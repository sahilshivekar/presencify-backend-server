import { InferenceSession, Tensor } from 'onnxruntime-node';
import { Jimp } from 'jimp';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 👉 Models
const recognizerModelPath = path.join(__dirname, '../assets/models/face_recognition_sface_2021dec.onnx');
const yuNetModelPath = path.join(__dirname, '../assets/models/face_detection_yunet_2023mar.onnx');

let recognizerSession = null;
let yuNetSession = null;

const initializeModels = async () => {
    if (!recognizerSession) {
        recognizerSession = await InferenceSession.create(recognizerModelPath);
    }
    if (!yuNetSession) {
        yuNetSession = await InferenceSession.create(yuNetModelPath);
    }
};

const computeIoU = (box1, box2) => {
    const x1 = Math.max(box1.x, box2.x);
    const y1 = Math.max(box1.y, box2.y);
    const x2 = Math.min(box1.x + box1.w, box2.x + box2.w);
    const y2 = Math.min(box1.y + box1.h, box2.y + box2.h);

    if (x2 < x1 || y2 < y1) return 0.0; // No overlap

    const intersection = (x2 - x1) * (y2 - y1);
    const area1 = box1.w * box1.h;
    const area2 = box2.w * box2.h;

    return intersection / (area1 + area2 - intersection);
};

// Filters out the overlapping 6400 boxes and keeps only the real faces
const applyNMS = (boxes, iouThreshold = 0.4) => {
    // Sort all boxes by confidence (Highest to Lowest)
    boxes.sort((a, b) => b.conf - a.conf);

    const selectedBoxes = [];
    const active = new Array(boxes.length).fill(true);

    for (let i = 0; i < boxes.length; i++) {
        if (!active[i]) continue;

        const bestBox = boxes[i];
        selectedBoxes.push(bestBox);

        // Check all remaining boxes. If they overlap too much with our best box, delete them!
        for (let j = i + 1; j < boxes.length; j++) {
            if (!active[j]) continue;
            if (computeIoU(bestBox, boxes[j]) > iouThreshold) {
                active[j] = false;
            }
        }
    }
    return selectedBoxes;
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

const cropFromFace = async (image, face) => {

    const imgW = image.bitmap.width;
    const imgH = image.bitmap.height;

    let { x, y, w, h } = face;

    // Convert normalized → absolute
    x *= imgW;
    y *= imgH;
    w *= imgW;
    h *= imgH;

    let cx = x + w / 2;
    let cy = y + h / 2;

    let size = Math.max(w, h) * 1.1;

    // Keep inside bounds
    size = Math.min(size, imgW, imgH);

    let newX = cx - size / 2;
    let newY = cy - size / 2;

    if (newX < 0) newX = 0;
    if (newY < 0) newY = 0;
    if (newX + size > imgW) newX = imgW - size;
    if (newY + size > imgH) newY = imgH - size;

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

const alignAndCrop = async (image, face) => {

    const { landmarks } = face;

    const leftEye = landmarks[0];
    const rightEye = landmarks[1];

    const dx = rightEye[0] - leftEye[0];
    const dy = rightEye[1] - leftEye[1];

    const angle = Math.atan2(dy, dx) * (180 / Math.PI);

    // 🔥 Rotate image
    const rotated = image.clone().rotate(-angle);

    // Now crop normally (reuse your logic)
    return await cropFromFace(rotated, face);
};

const generateSingleDescriptor = async (imagePath) => {
    await initializeModels();

    // 1. Read image
    const image = await Jimp.read(imagePath);

    const DETECT_SIZE = 640;

    // 2. Resize for YuNet
    const resized = image.clone().resize({
        w: DETECT_SIZE,
        h: DETECT_SIZE
    });

    // 3. Tensor (BGR)
    const yuNetTensor = imageToSFaceTensor(resized);

    const yuNetFeeds = {
        [yuNetSession.inputNames[0]]: yuNetTensor
    };

    const yuNetResults = await yuNetSession.run(yuNetFeeds);
    const outputs = yuNetResults;

    const get = (name) => outputs[name];

    const scales = [8, 16, 32];

    let bestBox = null;
    let bestScore = 0;

    // 🔥 4. Multi-scale decode + landmarks
    for (const s of scales) {

        const cls = get(`cls_${s}`).data;
        const obj = get(`obj_${s}`).data;
        const bbox = get(`bbox_${s}`).data;
        const kps = get(`kps_${s}`).data;

        const count = cls.length;

        for (let i = 0; i < count; i++) {

            const score = cls[i] * obj[i];

            if (score > bestScore) {
                bestScore = score;

                const bOffset = i * 4;
                const kOffset = i * 10;

                const cx = bbox[bOffset + 0];
                const cy = bbox[bOffset + 1];
                const w = bbox[bOffset + 2];
                const h = bbox[bOffset + 3];

                const landmarks = [
                    [kps[kOffset + 0], kps[kOffset + 1]], // left eye
                    [kps[kOffset + 2], kps[kOffset + 3]], // right eye
                    [kps[kOffset + 4], kps[kOffset + 5]], // nose
                    [kps[kOffset + 6], kps[kOffset + 7]], // mouth left
                    [kps[kOffset + 8], kps[kOffset + 9]]  // mouth right
                ];

                bestBox = { cx, cy, w, h, landmarks };
            }
        }
    }

    if (!bestBox || bestScore < 0.5) {
        throw new Error("No confident face detected");
    }

    // 🔥 5. SCALE FIX (VERY IMPORTANT)
    const scaleFactor = DETECT_SIZE;

    const x = (bestBox.cx - bestBox.w / 2) * scaleFactor;
    const y = (bestBox.cy - bestBox.h / 2) * scaleFactor;
    const width = bestBox.w * scaleFactor;
    const height = bestBox.h * scaleFactor;

    const face = {
        x: x / image.bitmap.width,
        y: y / image.bitmap.height,
        w: width / image.bitmap.width,
        h: height / image.bitmap.height,
        landmarks: bestBox.landmarks
    };

    console.log("Best score:", bestScore);

    // 🔥 6. ALIGN + CROP (uses your updated function)
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

const extractGroupEmbeddings = async (imagePath) => {
    await initializeModels();

    const image = await Jimp.read(imagePath);
    const DETECT_SIZE = 640;
    const resized = image.clone().resize({ w: DETECT_SIZE, h: DETECT_SIZE });

    const yuNetTensor = imageToSFaceTensor(resized);
    const yuNetFeeds = { [yuNetSession.inputNames[0]]: yuNetTensor };

    const yuNetResults = await yuNetSession.run(yuNetFeeds);

    const outputs = Object.values(yuNetResults)[0];
    const boxesData = outputs.data;

    let numFaces = outputs.dims.length === 3 ? outputs.dims[1] : outputs.dims[0];
    const candidateBoxes = [];

    // 1. First Pass: Throw away all the empty grid squares
    for (let i = 0; i < numFaces; i++) {
        const offset = i * 15;
        const conf = boxesData[offset + 14];

        // Only look at boxes that are 65% sure they contain a face
        if (conf > 0.65) {
            candidateBoxes.push({
                x: boxesData[offset + 0],
                y: boxesData[offset + 1],
                w: boxesData[offset + 2],
                h: boxesData[offset + 3],
                conf: conf
            });
        }
    }

    // 2. Second Pass: Run NMS to merge overlapping boxes into a single face
    const finalBoxes = applyNMS(candidateBoxes, 0.4);

    const embeddings = [];

    // 3. Loop through the actual, distinct faces in the crowd
    for (let i = 0; i < finalBoxes.length; i++) {
        const box = finalBoxes[i];

        // Convert absolute YuNet pixels to percentages for our cropping tool
        const face = {
            x: box.x / DETECT_SIZE,
            y: box.y / DETECT_SIZE,
            w: box.w / DETECT_SIZE,
            h: box.h / DETECT_SIZE
        };

        try {
            const cropped = await alignAndCrop(image, face);
            const recognizerTensor = imageToSFaceTensor(cropped);

            const recognizerFeeds = { [recognizerSession.inputNames[0]]: recognizerTensor };
            const recognizerResults = await recognizerSession.run(recognizerFeeds);
            const embedding = recognizerResults[recognizerSession.outputNames[0]].data;

            const norm = Math.sqrt(embedding.reduce((sum, v) => sum + v * v, 0));
            const normalized = Array.from(embedding).map(v => v / norm);

            embeddings.push(normalized);
        } catch (err) {
            console.error(`      -> ⚠️ Failed to extract embedding for face ${i + 1}:`, err.message);
        }
    }

    return embeddings;
};
// Export the new function
export { generateSingleDescriptor, extractGroupEmbeddings };