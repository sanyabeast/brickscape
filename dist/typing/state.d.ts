import { PerspectiveCamera, Scene, WebGLRenderer } from "three";
import { Block, Chunk } from "./chunk";
import { VoxelWorldGenerator } from "./generator";
import { VoxelMapControls as VoxelWorldControls } from "./controls";
import { Tasker } from "./tasker";
import { VoxelMap } from "./map";
interface IVoxelWorldState {
    blocks: {
        [x: string]: Block;
    };
    chunks: {
        [x: string]: Chunk;
    };
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
export declare enum BlockShape {
    Cube = 0,
    Prism6 = 1
}
export declare const state: IVoxelWorldState;
export declare const maxBlocksInChunk: number;
export {};
