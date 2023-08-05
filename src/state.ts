import { PerspectiveCamera, Scene, WebGLRenderer } from "three"
import { GenerationHelper } from "./generator"
import { IBrickscapeControls, BrickscapeEagleControls as VoxelWorldControls } from "./controls"
import { Tasker } from "./tasker"
import { MapManager } from "./map"
import { Block, BlockManager, BlockShape, blockManager } from "./blocks"
import { isMobileDevice } from "./utils"
import { WorldManager } from "./world"
import { RenderingHelper } from "./renderer"

export enum FeatureLevel {
    Low,
    Mid,
    High
}

export let featureLevel = isMobileDevice() ? FeatureLevel.Low : FeatureLevel.Mid
// featureLevel = FeatureLevel.Low


interface IAppState {
    frameDelta: number,
    timeDelta: number,
    seed: number,
    chunkSize: number,
    drawChunks: number
    blockShape: BlockShape
    worldHeight: number
    map: MapManager
    controls: IBrickscapeControls
    camera: PerspectiveCamera
    scene: Scene
    renderer: RenderingHelper
    generator: GenerationHelper,
    tasker: Tasker
    world: WorldManager
    blockManager: BlockManager
}

export const state: IAppState = {
    frameDelta: 1,
    timeDelta: 0,
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
    generator: null,
    tasker: null,
    world: null,
    blockManager: null
}