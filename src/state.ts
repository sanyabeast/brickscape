import { PerspectiveCamera, Scene, WebGLRenderer } from "three"
import { VoxelWorldGenerator } from "./generator"
import { VoxelMapControls as VoxelWorldControls } from "./controls"
import { Tasker } from "./tasker"
import { MapManager } from "./map"
import { Block, BlockManager, BlockShape, blockManager } from "./blocks"
import { isMobileDevice } from "./utils"
import { WorldManager } from "./world"

interface IAppState {
    maxChunksInMemory: number
    seed: number,
    chunkSize: number,
    drawChunks: number
    blockShape: BlockShape
    worldHeight: number
    map: MapManager
    controls: VoxelWorldControls
    canvas: HTMLCanvasElement
    camera: PerspectiveCamera
    scene: Scene
    renderer: WebGLRenderer
    generator: VoxelWorldGenerator,
    tasker: Tasker
    world: WorldManager
    blockManager: BlockManager
}

export const state: IAppState = {
    maxChunksInMemory: 512,
    seed: 1,
    chunkSize: 10,
    // drawChunks: isMobileDevice() ? 2 : 1,
    drawChunks: 3,
    blockShape: BlockShape.Prism6,
    worldHeight: 10,
    camera: null,
    scene: null,
    renderer: null,
    controls: null,
    map: null,
    canvas: null,
    generator: null,
    tasker: null,
    world: null,
    blockManager: null
}