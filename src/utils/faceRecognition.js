import { InferenceSession, Tensor } from 'onnxruntime-node';
import { Jimp } from 'jimp';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 👉 Models
const detectorModelPath = path.join(__dirname, '../assets/models/blaze.onnx');
const recognizerModelPath = path.join(__dirname, '../assets/models/face_recognition_sface_2021dec.onnx');
const yuNetModelPath = path.join(__dirname, '../assets/models/face_detection_yunet_2023mar.onnx');

let detectorSession = null;
let recognizerSession = null;
let yuNetSession = null;

const initializeModels = async () => {
    if (!detectorSession) {
        detectorSession = await InferenceSession.create(detectorModelPath);
    }
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

const extractGroupEmbeddings = async (imagePath) => {
    await initializeModels();

    const image = await Jimp.read(imagePath);
    const DETECT_SIZE = 640;
    const resized = image.clone().resize({ w: DETECT_SIZE, h: DETECT_SIZE });

    const yuNetTensor = imageToSFaceTensor(resized);
    const yuNetFeeds = { [yuNetSession.inputNames[0]]: yuNetTensor };

    console.log(`   🤖 Running YuNet Crowd Detector...`);
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

    console.log(`   🔎 Found ${candidateBoxes.length} raw overlapping boxes. Running NMS...`);

    // 2. Second Pass: Run NMS to merge overlapping boxes into a single face
    const finalBoxes = applyNMS(candidateBoxes, 0.4);

    console.log(`   ✅ Kept ${finalBoxes.length} unique, distinct faces!`);

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
            console.error(`      -> ⚠️ Failed to extract embedding for face ${i+1}:`, err.message);
        }
    }

    return embeddings;
};
// Export the new function
export { generateSingleDescriptor, extractGroupEmbeddings };