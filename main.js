let image = document.getElementById('image');
image.crossOrigin = 'anonymous';
let original = image;
let canvas = document.getElementById('image-canvas');
canvas.crossOrigin = 'anonymous';
let context;

class RGBColor {
    constructor(r, g, b) {
        this.red = r;
        this.green = g;
        this.blue = b;
    }
}

class RGBAColor extends RGBColor{
    constructor(r, g, b, a) {
        super(r, g, b);
        this.alpha = a;
    }
}

class MatrixImage {
    constructor(imgData) {
        this.imgData = imgData;
        this.height = imgData.height;
        this.width = imgData.width;
    }

    getPixel(x, y) {
        let position = ((y * (this.width * 4)) + (x * 4));
        return new RGBAColor(
            this.imgData.data[position],  // red
            this.imgData.data[position + 1],  // green
            this.imgData.data[position + 2],  // blue
            this.imgData.data[position + 3],  // alpha
        );
    }

    setPixel(x, y, color) {
        let position = ((y * (this.width * 4)) + (x * 4));
        this.imgData.data[position] = color.red;
        this.imgData.data[position + 1] = color.green;
        this.imgData.data[position + 2] = color.blue;
        if (color.alpha !== undefined){
            this.imgData.data[position + 3] = color.alpha;
        }
    }
}

let drawImage = function(cv, ctx, image) {
    cv.width = image.width;
    cv.height = image.height;
    ctx.drawImage(image, 0, 0);
}

function delay(milliseconds){
    return new Promise(resolve => {
        setTimeout(resolve, milliseconds);
    });
}

let load = async function (){
    original = image;
    await delay(1300);
    context = canvas.getContext('2d');
    drawImage(canvas, context, image);
}

let reset = function (){
    context = canvas.getContext('2d');
    drawImage(canvas, context, original);
}

let redScale = function() {
    const imgData = context.getImageData(0, 0, canvas.width, canvas.height);
    const data = imgData.data;
    for (let i = 0; i < data.length; i+=4) {
        data[i+1] = 0;
        data[i+2] = 0;
    }
    context.putImageData(imgData, 0, 0);
}

let greenScale = function() {
    const imgData = context.getImageData(0, 0, canvas.width, canvas.height);
    const data = imgData.data;
    for (let i = 0; i < data.length; i+=4) {
        data[i] = 0;
        data[i+2] = 0;
    }
    context.putImageData(imgData, 0, 0);
}

let blueScale = function() {
    const imgData = context.getImageData(0, 0, canvas.width, canvas.height);
    const data = imgData.data;
    for (let i = 0; i < data.length; i+=4) {
        data[i] = 0;
        data[i+1] = 0;
    }
    context.putImageData(imgData, 0, 0);
}

let grayScale = function() {
    const imgData = context.getImageData(0, 0, canvas.width, canvas.height);
    const data = imgData.data;
    for (let i = 0; i < data.length; i+=4) {
        const red = data[i];
        const green = data[i + 1];
        const blue = data[i+2];
        const gray = (red + green + blue) / 3;
        data[i] = data[i+1] = data[i+2] = gray;
    }
    context.putImageData(imgData, 0, 0);
}

let grayCIEScale = function() {
    const imgData = context.getImageData(0, 0, canvas.width, canvas.height);
    const data = imgData.data;
    for (let i = 0; i < data.length; i+=4) {
        const red = data[i];
        const green = data[i+1];
        const blue = data[i+2];
        const gray = (red * 0.2126 + green * 0.7152 + blue * 0.0722);
        data[i] = data[i+1] = data[i+2] = gray;
    }
    context.putImageData(imgData, 0, 0);
}

let grayNTSCScale = function() {
    const imgData = context.getImageData(0, 0, canvas.width, canvas.height);
    const data = imgData.data;
    for (let i = 0; i < data.length; i+=4) {
        const red = data[i];
        const green = data[i+1];
        const blue = data[i+2];
        const gray = (red * 0.299 + green * 0.587 + blue * 0.144);
        data[i] = data[i+1] = data[i+2] = gray;
    }
    context.putImageData(imgData, 0, 0);
}

let binarize = function() {
    const imgData = context.getImageData(0, 0, canvas.width, canvas.height);
    const data = imgData.data;
    const grayScale = [];
    for (let i = 0; i < data.length; i+=4) {
        const red = data[i];
        const green = data[i + 1];
        const blue = data[i + 2];
        const gray = (red + green + blue) / 3;
        grayScale.push(gray);
    }
    const binarize = grayScale.reduce((a, b) => a + b, 0) / grayScale.length; 

    for (let i = 0; i < data.length; i+=4) {
        const red = data[i];
        const green = data[i+1];
        const blue = data[i+2];
        const gray = ((red + green + blue) / 3) <= binarize ? 0: 255;
        data[i] = data[i+1] = data[i+2] = gray;
    }
    context.putImageData(imgData, 0, 0);
}

let pixelPush = function (neighbors, pixel) {
    neighbors.push(pixel.red);
    neighbors.push(pixel.green);
    neighbors.push(pixel.blue);
}


let average = function() {
    let imgData = context.getImageData(0, 0, canvas.width, canvas.height);
    let image = new MatrixImage(imgData);
    for (let i = 2; i < image.width - 2; i++) {
        for (let j = 2; j < image.height - 2; j++) {
            const neighbors = Array();
            const pixel1 = image.getPixel(i - 1, j - 1);
            pixelPush(neighbors, pixel1);
            const pixel2 = image.getPixel(i - 1, j);
            pixelPush(neighbors, pixel2);
            const pixel3 = image.getPixel(i, j - 1);
            pixelPush(neighbors, pixel3);
            const pixel4 = image.getPixel(i + 1, j - 1);
            pixelPush(neighbors, pixel4);
            const pixel5 = image.getPixel(i, j);
            pixelPush(neighbors, pixel5);
            const pixel6 = image.getPixel(i - 1, j + 1);
            pixelPush(neighbors, pixel6);
            const pixel7 = image.getPixel(i, j + 1);
            pixelPush(neighbors, pixel7);
            const pixel8 = image.getPixel(i + 1, j);
            pixelPush(neighbors, pixel8);
            const pixel9 = image.getPixel(i + 1, j + 1);
            pixelPush(neighbors, pixel9);
            const gray = neighbors.reduce((a, b) => a + b, 0) / neighbors.length;
            image.setPixel(i, j, new RGBColor(gray, gray, gray));
        }
    }
    context.putImageData(image.imgData, 0, 0);
}

const medArray = arr => {
    let mid = Math.floor(arr.length / 2);
    arr = [...arr].sort((a, b) => a - b);
    return arr.length % 2 !== 0 ? arr[mid] : (arr[mid - 1] + arr[mid]) / 2;
};

let median = function() {
    let imgData = context.getImageData(0, 0, canvas.width, canvas.height);
    let image = new MatrixImage(imgData);
    for (let i = 2; i < image.width-2; i++) {
        for (let j = 2; j < image.height-2; j++) {
            const neighbors = Array();
            const pixel1 = image.getPixel(i - 1, j - 1);
            pixelPush(neighbors, pixel1);
            const pixel2 = image.getPixel(i - 1, j);
            pixelPush(neighbors, pixel2);
            const pixel3 = image.getPixel(i, j - 1);
            pixelPush(neighbors, pixel3);
            const pixel4 = image.getPixel(i + 1, j - 1);
            pixelPush(neighbors, pixel4);
            const pixel5 = image.getPixel(i, j);
            pixelPush(neighbors, pixel5);
            const pixel6 = image.getPixel(i - 1, j + 1);
            pixelPush(neighbors, pixel6);
            const pixel7 = image.getPixel(i, j + 1);
            pixelPush(neighbors, pixel7);
            const pixel8 = image.getPixel(i + 1, j);
            pixelPush(neighbors, pixel8);
            const pixel9 = image.getPixel(i + 1, j + 1);
            pixelPush(neighbors, pixel9);
            const gray = medArray(neighbors);
            image.setPixel(i, j, new RGBColor(gray, gray, gray));
        }
    }
    context.putImageData(image.imgData, 0, 0);
}

let gaussian = function() {
    const rad = 6;
    const blur = rad;
    const range = blur * 3;
    const parameter = new Array;
    for (let i = 0; i <= range; i++){
      parameter[i] = Math.exp(-i * i / (2 * blur * blur));
    }

    const imgData = context.getImageData(0, 0, canvas.width, canvas.height);
    const image = new MatrixImage(imgData);
    const width = image.width;
    const height = image.height;

    const data = imgData.data;
    let ox, oy, gauss, count, R, G, B, A;
    for(let i = 0, len = width * height; i<len; i++){
        gauss = count = R = G = B = A = 0;
        ox = i % width;
        oy = (i / width)|0;
        for (let x = -1 * range; x <= range; x++){
            const tx = ox + x;
            if ((0 <= tx) && (tx < width)){
                gauss = parameter[x<0?-x:x];
                const k = i + x;
                R += data[k*4 + 0] * gauss;
                G += data[k*4 + 1] * gauss;
                B += data[k*4 + 2] * gauss;
                A += data[k*4 + 3] * gauss;
                count += gauss;
            }
        }
        data[i*4 + 0] = (R / count)|0;
        data[i*4 + 1] = (G / count)|0;
        data[i*4 + 2] = (B / count)|0;
        data[i*4 + 3] = (A / count)|0;
    }
    context.putImageData(imgData, 0, 0);
}

let bright = function() {
    const imgData = context.getImageData(0, 0, canvas.width, canvas.height);
    const data = imgData.data;
    for (let i = 0; i < data.length; i+=4) {
        data[i] *= 1.75;
        data[i+1] *= 1.75;
        data[i+2] *= 1.75;
    }
    context.putImageData(imgData, 0, 0);
}

let contrast = function() {
    const imgData = context.getImageData(0, 0, canvas.width, canvas.height);
    const data = imgData.data;

    let redFactor = 0;
    let greenFactor = 0;
    let blueFactor = 0;

    for (let i = 0; i < data.length; i+=4) {
        redFactor += data[i];
        greenFactor += data[i+1];
        blueFactor += data[i+2];
    }
    redFactor = redFactor % 255 * 0.05;
    greenFactor = greenFactor % 255 * 0.05;
    blueFactor = blueFactor % 255 * 0.05;

    for (let i = 0; i < data.length; i+=4) {
        data[i] *= redFactor;
        data[i+1] *= greenFactor;
        data[i+2] *= blueFactor;
    }
    context.putImageData(imgData, 0, 0);
}

let xFlip = function() {
    let imgData = context.getImageData(0, 0, canvas.width, canvas.height);
    let image = new MatrixImage(imgData);
    for (let i = 0; i < image.width / 2; i++) {
        for (let j = 0; j < image.height; j++) {
            const pixel= image.getPixel(i, j);
            const columnToFlip = (image.width - 1) - i
            const pixelInverted = image.getPixel(columnToFlip, j);
            image.setPixel(i, j, pixelInverted);
            image.setPixel(columnToFlip, j, pixel);
        }
    }
    context.putImageData(image.imgData, 0, 0);
}

let yFlip = function() {
    let imgData = context.getImageData(0, 0, canvas.width, canvas.height);
    let image = new MatrixImage(imgData);
    for (let i = 0; i < image.width; i++) {
        for (let j = 0; j < image.height / 2; j++) {
            const pixel= image.getPixel(i, j);
            const lineToFlip = (image.height - 1) - j
            const pixelInverted = image.getPixel(i, lineToFlip);
            image.setPixel(i, j, pixelInverted);
            image.setPixel(i, lineToFlip, pixel);
        }
    }
    context.putImageData(image.imgData, 0, 0);
}

let tilted = false;

let rotate = function() {
    let horizontal = tilted;
    if (!tilted){
        drawImage(canvas, context, image, true);
        tilted = true;
    }
    let imgData = context.getImageData(0, 0, canvas.width, canvas.height);
    let img = new MatrixImage(imgData);
    let imgDataRotate = context.getImageData(0, 0, canvas.width, canvas.height);
    let imgRotate = new MatrixImage(imgDataRotate);
    for (let i = 0; i < img.width; i++) {
        for (let j = 0; j < img.height; j++) {
            const pixel= img.getPixel(i, j);
            imgRotate.setPixel(j, i, pixel);
        }
    }
    if (horizontal) {
        drawImage(canvas, context, image);
        tilted = false;
    }
    context.putImageData(imgRotate.imgData, 0, 0);
}


document.getElementById('btnLoad').addEventListener('click', load);
document.getElementById('btnReset').addEventListener('click', reset);
document.getElementById('btnRed').addEventListener('click', redScale);
document.getElementById('btnGreen').addEventListener('click', greenScale);
document.getElementById('btnBlue').addEventListener('click', blueScale);
document.getElementById('btnGray').addEventListener('click', grayScale);
document.getElementById('btnCIEGray').addEventListener('click', grayCIEScale);
document.getElementById('btnNTSCGray').addEventListener('click', grayNTSCScale);
document.getElementById('btnBin').addEventListener('click', binarize);
document.getElementById('btnAvg').addEventListener('click', average);
document.getElementById('btnMed').addEventListener('click', median);
document.getElementById('btnGaus').addEventListener('click', gaussian);
document.getElementById('btnBright').addEventListener('click', bright);
document.getElementById('btnContr').addEventListener('click', contrast);
document.getElementById('btnXFlip').addEventListener('click', xFlip);
document.getElementById('btnYFlip').addEventListener('click', yFlip);
document.getElementById('btnRotate').addEventListener('click', rotate);