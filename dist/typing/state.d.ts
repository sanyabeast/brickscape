import { PerspectiveCamera, Scene, WebGLRenderer } from "three";
import { VoxelWorldGenerator } from "./generator";
import { VoxelMapControls as VoxelWorldControls } from "./controls";
import { Tasker } from "./tasker";
import { MapManager } from "./map";
import { BlockManager, BlockShape } from "./blocks";
import { WorldManager } from "./world";
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
    generator: VoxelWorldGenerator;
    tasker: Tasker;
    world: WorldManager;
    blockManager: BlockManager;
}
export declare const state: IAppState;
export {};
