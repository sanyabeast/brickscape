import { PerspectiveCamera, Scene, WebGLRenderer } from "three";
import { GenerationHelper } from "./generator";
import { VoxelMapControls as VoxelWorldControls } from "./controls";
import { Tasker } from "./tasker";
import { MapManager } from "./map";
import { BlockManager, BlockShape } from "./blocks";
import { WorldManager } from "./world";
export declare enum FeatureLevel {
    Low = 0,
    Mid = 1,
    High = 2
}
export declare let featureLevel: FeatureLevel;
interface IAppState {
    maxChunksInMemory: number;
    seed: number;
    chunkSize: number;
    drawChunks: number;
    blockShape: BlockShape;
    worldHeight: number;
    map: MapManager;
    controls: VoxelWorldControls;
    canvas: HTMLCanvasElement;
    camera: PerspectiveCamera;
    scene: Scene;
    renderer: WebGLRenderer;
    generator: GenerationHelper;
    tasker: Tasker;
    world: WorldManager;
    blockManager: BlockManager;
}
export declare const state: IAppState;
export {};
