import { PerspectiveCamera, Scene, WebGLRenderer } from "three"
import { Chunk } from "./chunk"
import { VoxelWorldGenerator } from "./generator"
import { VoxelMapControls as VoxelWorldControls } from "./controls"
import { Tasker } from "./tasker"
import { VoxelMap } from "./map"
import { Block, BlockShape } from "./blocks"

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
    generator: null,
    tasker: null
}