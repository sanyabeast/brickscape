import { PerspectiveCamera, Scene, WebGLRenderer } from "three"
import { Block, Chunk } from "./chunk"
import { VoxelWorldGenerator } from "./generator"
import { VoxelMapControls as VoxelWorldControls } from "./controls"

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
    generator: VoxelWorldGenerator
}

export const state: IVoxelWorldState = {
    seed: 123,
    chunkSize: 32,
    drawChunks: 1,
    worldHeight: 12,
    camera: null,
    scene: null,
    renderer: null,
    controls: null,
    map: null,
    canvas: null,
    chunks: {},
    blocks: {},
    generator: null
}