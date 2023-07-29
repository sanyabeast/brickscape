import { PerspectiveCamera, Scene, WebGLRenderer } from "three"
import { VoxelWorldGenerator } from "./generator"
import { VoxelMapControls as VoxelWorldControls } from "./controls"
import { Tasker } from "./tasker"
import { WorldManager } from "./world"
import { Block, BlockShape } from "./blocks"
import { isMobileDevice } from "./utils"

interface IAppState {
    maxChunksInMemory: number
    seed: number,
    chunkSize: number,
    drawChunks: number
    blockShape: BlockShape
    worldHeight: number
    map: WorldManager
    controls: VoxelWorldControls
    canvas: HTMLCanvasElement
    camera: PerspectiveCamera
    scene: Scene
    renderer: WebGLRenderer
    generator: VoxelWorldGenerator,
    tasker: Tasker
}

export const state: IAppState = {
    maxChunksInMemory: 512,
    seed: 1,
    chunkSize: isMobileDevice() ? 8 : 10,
    drawChunks: isMobileDevice() ? 1 : 3,
    blockShape: BlockShape.Cube,
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