import { PerspectiveCamera, Scene, WebGLRenderer } from "three"
import { Block, Chunk } from "./chunk"
import { VoxelWorldGenerator } from "./generator"
import { VoxelMapControls as VoxelWorldControls } from "./controls"
import { Tasker } from "./tasker"
import { VoxelMap } from "./map"
import { getBlockId } from "./utils"

interface IVoxelWorldState {
    blocks: {
        [x: string]: Block
    }
    chunks: {
        [x: string]: Chunk
    }
    maxChunksInMemory: number
    seed: number,
    chunkSize: number,
    drawChunks: number
    blockShape: BlockShape
    worldHeight: number
    map: VoxelMap
    controls: VoxelWorldControls
    canvas: HTMLCanvasElement
    camera: PerspectiveCamera
    scene: Scene
    renderer: WebGLRenderer
    generator: VoxelWorldGenerator,
    tasker: Tasker
}

export enum BlockShape {
    Cube,
    Prism6
}

export const state: IVoxelWorldState = {
    maxChunksInMemory: 256,
    seed: 1,
    chunkSize: 12,
    drawChunks: 2,
    blockShape: BlockShape.Prism6,
    worldHeight: 12,
    camera: null,
    scene: null,
    renderer: null,
    controls: null,
    map: null,
    canvas: null,
    chunks: {},
    blocks: {},
    generator: null,
    tasker: null
}

class BlocksManager {
    getMostElevatedBlockAt(x: number, z: number): Block {
        let r: Block = null

        for (let i = 0; i < state.worldHeight; i++) {
            let b = state.blocks[getBlockId(x, i, z)]
            if (b) {
                r = b
            }
        }

        return r
    }
    getElevationAt(x: number, z: number): number {
        let r: number = 0

        for (let i = 0; i < state.worldHeight; i++) {
            let b = state.blocks[getBlockId(x, i, z)]
            if (b) {
                r = i
            }
        }

        return r
    }
    getBlockAt(x: number, y: number, z: number): Block {
        return state.blocks[getBlockId(x, y, z)]
    }
}

export const blocksHelper = new BlocksManager()

export const maxBlocksInChunk = state.chunkSize * state.chunkSize * state.worldHeight;