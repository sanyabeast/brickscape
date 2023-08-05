import { Scene } from "three";
import { GenerationHelper } from "./generator";
import { IBrickscapeControls } from "./controls";
import { Tasker } from "./tasker";
import { MapManager } from "./map";
import { BlockManager, BlockShape } from "./blocks";
import { WorldManager } from "./world";
import { RenderingHelper } from "./renderer";
export declare enum FeatureLevel {
    Low = 0,
    Mid = 1,
    High = 2
}
export declare let featureLevel: FeatureLevel;
interface IAppState {
    frameDelta: number;
    timeDelta: number;
    seed: number;
    chunkSize: number;
    drawChunks: number;
    blockShape: BlockShape;
    worldHeight: number;
    map: MapManager;
    controls: IBrickscapeControls;
    scene: Scene;
    renderer: RenderingHelper;
    generator: GenerationHelper;
    tasker: Tasker;
    world: WorldManager;
    blockManager: BlockManager;
}
export declare const state: IAppState;
export {};
