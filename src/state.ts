import { PerspectiveCamera, Scene, WebGLRenderer } from "three"
import { GenerationHelper } from "./generator"
import { VoxelMapControls as VoxelWorldControls } from "./controls"
import { Tasker } from "./tasker"
import { MapManager } from "./map"
import { Block, BlockManager, BlockShape, blockManager } from "./blocks"
import { isMobileDevice } from "./utils"
import { WorldManager } from "./world"

export enum FeatureLevel {
    Low,
    Mid,
    High
}

export let featureLevel = isMobileDevice() ? FeatureLevel.Low : FeatureLevel.Mid
// featureLevel = FeatureLevel.Low


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
    generator: GenerationHelper,
    tasker: Tasker
    world: WorldManager
    blockManager: BlockManager
}

export const state: IAppState = {
    maxChunksInMemory: 512,
    seed: 12,
    chunkSize: featureLevel == FeatureLevel.Low ? 8 : 10,
    drawChunks: featureLevel == FeatureLevel.Low ? 2 : 1,
    blockShape: BlockShape.Cube,
    worldHeight: 12,
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