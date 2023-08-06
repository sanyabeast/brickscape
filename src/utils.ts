import { Object3D } from "three";

function stringToSeed(str) {
    let seed = 0;
    for (let i = 0; i < str.length; i++) {
        seed = (seed * 31 + str.charCodeAt(i)) & 0xFFFFFFFF;
    }
    return seed;
}

function getRandomColorFromStringSeed(str) {
    const seed = stringToSeed(str);
    const randomColor = `#${(seed & 0xFFFFFF).toString(16).padStart(6, '0')}`;
    return randomColor;
}

export function printd(...args) {
    console.log(...args)
}

export function getNearestMultiple(num: number, div: number = 1) {
    return Math.floor(num / div) * div
}

export function getNearestMultipleUp(num: number, div: number = 1) {
    return Math.ceil(num / div) * div
}

export function getAlpha(a, b, test) {
    return clamp(1 - ((b - test) / (b - a)), 0, 1)
}

(window as any).getAlpha = getAlpha

export function clamp(value: number, min: number, max: number): number {
    return Math.min(Math.max(value, min), max);
}

export function lerp(start: number, end: number, t: number): number {
    return start * (1 - t) + end * t;
}

export function logd(tag: string, ...args: any[]) {
    console.log(`%c[voxelworld] ${tag} [i]: `, `color: ${getRandomColorFromStringSeed(tag)}`, ...args)
}

export function getChunkId(cx: number, cz: number): string {
    return `c${cx}_${cz}`
}

export function getRandomHexColor() {
    return Math.floor(Math.random() * 16777215)
}

export function distance(ax, ay, bx, by): number {
    return Math.sqrt(Math.pow(ax - bx, 2) + Math.pow(ay - by, 2))
}

export function isMobileDevice() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

export async function waitForCallback(callback: (resolve: (value: unknown) => void) => void) {
    return new Promise((resolve) => {
        callback(resolve)
    })
}

export function getPixelBrightness(imageElement, x, y): number {
    let ctx;
    const width = imageElement.width;
    const height = imageElement.height;

    if (imageElement._ctx) {
        ctx = imageElement._canvasCtx
    } else {
        let canvas = document.createElement("canvas");
        ctx = canvas.getContext("2d");

        canvas.width = width;
        canvas.height = height;

        // Draw the image onto the canvas
        ctx.drawImage(imageElement, 0, 0, width, height);
        imageElement._canvasCtx = ctx
    }


    // Ensure coordinates are within the image boundaries
    x = Math.floor(x % width);
    y = Math.floor(y % height);


    // Get the pixel data of the image at the specified coordinates
    const imageData = ctx.getImageData(x, y, 1, 1).data;

    // Calculate the brightness (average of RGB values) of the pixel
    const brightness = (imageData[0] + imageData[1] + imageData[2]) / 3;

    // Return the brightness value
    return brightness / 256;
}


export function getPixelBrightness2(imageElement, x, y) {
    let ctx;
    const width = imageElement.width;
    const height = imageElement.height;

    if (imageElement._ctx) {
        ctx = imageElement._canvasCtx
    } else {
        let canvas = document.createElement("canvas");
        ctx = canvas.getContext("2d");

        canvas.width = width;
        canvas.height = height;

        // Draw the image onto the canvas
        ctx.drawImage(imageElement, 0, 0, width, height);
        imageElement._canvasCtx = ctx
    }


    let px = Math.floor(x)
    let py = Math.floor(y)

    let xa = getAlpha(px, px + 1, x)
    let ya = getAlpha(py, py + 1, y)

    let brightness0 = getPixelBrightness(imageElement, px, py)

    let brightness1 = lerp(
        brightness0,
        getPixelBrightness(imageElement, px + 1, py),
        xa
    );

    let brightness2 = lerp(
        brightness0,
        getPixelBrightness(imageElement, px, py + 1),
        ya
    );

    let brightness3 = lerp(
        brightness0,
        getPixelBrightness(imageElement, px + 1, py + 1),
        ya * xa
    );

    let brightness = (brightness0 + brightness1 + brightness2 + brightness2) / 4


    return brightness


}

export function slide(from: number, to: number, delta: number): number {
    delta = from <= to ? delta : -delta
    return clamp(from + delta, from <= to ? from : to, from <= to ? to : from)
}

(window as any).slide = slide