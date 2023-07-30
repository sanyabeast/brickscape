import { BlockType } from "./blocks";
import { EBlockReplacingStrategy, IBlockCreationLevels, IBlockCreationRule, IBlockPlacement } from "./rules";
export declare class WorldManager {
    static instance: WorldManager;
    static getInstance(): WorldManager;
    get needsUpdate(): boolean;
    _chunksGeneratedStatus: {
        [x: string]: boolean;
    };
    updatedChunks: number[][];
    constructor();
    checkChunkGeneration(cx: number, cz: number): boolean;
    cancel(): void;
    _genrateChunkWithRules(cx: number, cz: number): void;
    _placeStructure(x: number, y: number, z: number, structure: IBlockPlacement[], replaceStrategy: EBlockReplacingStrategy): void;
    _placeBlock(x: any, y: any, z: any, blockType: BlockType, replaceStrategy: EBlockReplacingStrategy): void;
    _testLevels(y: number, levels: IBlockCreationLevels[]): boolean;
    _testCreationRule(x: number, y: number, z: number, creationRule: IBlockCreationRule): boolean;
    _generateChunk(cx: number, cz: number): void;
    _updateChunkLighting(cx: number, cz: number): void;
}
export declare const worldManager: WorldManager;
