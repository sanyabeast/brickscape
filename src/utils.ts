

export function getNearestMultiple(num: number, div: number = 1) {
    // Lower and upper multiples
    const lower = Math.floor(num / div) * div;
    const upper = Math.ceil(num / div) * div;

    // Return the nearest one
    return (num - lower < upper - num) ? lower : upper;
}

export function logd(tag: String, ...args: any[]) {
    console.log(`[voxelworld] ${tag} [i]: `, ...args)
}

export function SeededRandom(seed) {
    const m = 0x80000000; // 2**31;
    const a = 1103515245;
    const c = 12345;

    seed = seed || Math.floor(Math.random() * m);

    return function () {
        seed = (a * seed + c) % m;
        return seed / m;
    };
}

export function getChunkId(cx: number, cy: number): String {
    return `${cx}_${cy}`
}

export class PerlinNoise {
    seed: number
    permutationTable: Uint8Array
    constructor(seed) {
        this.seed = seed;
        this.permutationTable = new Uint8Array(512);
        this.generatePermutationTable();
    }

    generatePermutationTable() {
        const p = new Uint8Array(256);
        for (let i = 0; i < 256; i++) {
            p[i] = Math.random() * 256;
        }
        for (let i = 0; i < 512; i++) {
            this.permutationTable[i] = p[i & 255];
        }
    }

    fade(t) {
        return t * t * t * (t * (t * 6 - 15) + 10);
    }

    lerp(t, a, b) {
        return a + t * (b - a);
    }

    grad(hash, x, y, z) {
        const h = hash & 15;
        const u = h < 8 ? x : y;
        const v = h < 4 ? y : h === 12 || h === 14 ? x : z;
        return ((h & 1) === 0 ? u : -u) + ((h & 2) === 0 ? v : -v);
    }

    noise(x, y, z) {
        const X = Math.floor(x) & 255;
        const Y = Math.floor(y) & 255;
        const Z = Math.floor(z) & 255;

        x -= Math.floor(x);
        y -= Math.floor(y);
        z -= Math.floor(z);

        const u = this.fade(x);
        const v = this.fade(y);
        const w = this.fade(z);

        const A = this.permutationTable[X] + Y;
        const AA = this.permutationTable[A] + Z;
        const AB = this.permutationTable[A + 1] + Z;
        const B = this.permutationTable[X + 1] + Y;
        const BA = this.permutationTable[B] + Z;
        const BB = this.permutationTable[B + 1] + Z;

        return this.lerp(w, this.lerp(v, this.lerp(u, this.grad(this.permutationTable[AA], x, y, z), this.grad(this.permutationTable[BA], x - 1, y, z)), this.lerp(u, this.grad(this.permutationTable[AB], x, y - 1, z), this.grad(this.permutationTable[BB], x - 1, y - 1, z))), this.lerp(v, this.lerp(u, this.grad(this.permutationTable[AA + 1], x, y, z - 1), this.grad(this.permutationTable[BA + 1], x - 1, y, z - 1)), this.lerp(u, this.grad(this.permutationTable[AB + 1], x, y - 1, z - 1), this.grad(this.permutationTable[BB + 1], x - 1, y - 1, z - 1))));
    }

    getPerlinValue(x, y, scale, distortion) {
        return (this.noise(this.seed + x * scale, this.seed + y * scale, distortion) + 1) / 2;
    }
}