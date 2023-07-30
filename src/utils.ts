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

export function getNearestMultiple(num: number, div: number = 1) {
    return Math.floor(num / div) * div
}

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

