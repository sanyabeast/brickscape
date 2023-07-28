import { PerspectiveCamera, Scene, WebGLRenderer } from "three"
import { Block, Chunk } from "./chunk"
import { VoxelWorldGenerator } from "./generator"
import { VoxelMapControls as VoxelWorldControls } from "./controls"
import { Tasker } from "./tasker"
import { VoxelMap } from "./map"

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
    maxChunksInMemory: 512,
    seed: 543,
    chunkSize: 16,
    drawChunks: 2,
    blockShape: BlockShape.Prism6,
    worldHeight: 5,
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

export const maxBlocksInChunk = state.chunkSize * state.chunkSize * state.worldHeight;