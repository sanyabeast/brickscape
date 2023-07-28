import { PerspectiveCamera, Scene, WebGLRenderer } from "three";
import { VoxelWorldGenerator } from "./generator";
import { VoxelMapControls as VoxelWorldControls } from "./controls";
import { Tasker } from "./tasker";
import { VoxelMap } from "./map";
import { BlockShape } from "./blocks";
interface IVoxelWorldState {
    maxChunksInMemory: number;
    seed: number;
    chunkSize: number;
    drawChunks: number;
    blockShape: BlockShape;
    worldHeight: number;
    map: VoxelMap;
    controls: VoxelWorldControls;
    canvas: HTMLCanvasElement;
    camera: PerspectiveCamera;
    scene: Scene;
    renderer: WebGLRenderer;
    generator: VoxelWorldGenerator;
    tasker: Tasker;
}
export declare const state: IVoxelWorldState;
export {};
