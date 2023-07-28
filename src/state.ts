import { PerspectiveCamera, Scene, WebGLRenderer } from "three"
import { VoxelWorldGenerator } from "./generator"
import { VoxelMapControls as VoxelWorldControls } from "./controls"
import { Tasker } from "./tasker"
import { VoxelMap } from "./map"
import { Block, BlockShape } from "./blocks"
import { isMobileDevice } from "./utils"

interface IVoxelWorldState {
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

export const state: IVoxelWorldState = {
    maxChunksInMemory: 512,
    seed: 1,
    chunkSize: isMobileDevice() ? 8 : 10,
    drawChunks: isMobileDevice() ? 1 : 3,
    blockShape: BlockShape.Prism6,
    worldHeight: 10,
    camera: null,
    scene: null,
    renderer: null,
    controls: null,
    map: null,
    canvas: null,
    generator: null,
    tasker: null
}