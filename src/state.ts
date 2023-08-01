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
    seed: 454,
    chunkSize: featureLevel == FeatureLevel.Low ? 8 : 12,
    drawChunks: featureLevel == FeatureLevel.Low ? 2 : 3,
    blockShape: BlockShape.Cube,
    worldHeight: 24,
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