import { PerspectiveCamera, Scene, WebGLRenderer } from "three"
import { Block, Chunk } from "./chunk"
import { VoxelWorldGenerator } from "./generator"
import { VoxelMapControls as VoxelWorldControls } from "./controls"
import { Tasker } from "./tasker"

interface IVoxelWorldState {
    [x: string]: any
    blocks: {
        [x: string]: Block
    }
    chunks: {
        [x: string]: Chunk
    }
    seed: number,
    chunkSize: number,
    drawChunks: number
    worldHeight: number
    controls: VoxelWorldControls
    canvas: HTMLCanvasElement
    camera: PerspectiveCamera
    scene: Scene
    renderer: WebGLRenderer
    generator: VoxelWorldGenerator,
    tasker: Tasker
}

export const state: IVoxelWorldState = {
    seed: 123,
    chunkSize: 8,
    drawChunks: 3,
    worldHeight: 8,
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