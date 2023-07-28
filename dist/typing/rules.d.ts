import { BlockType } from "./blocks";
export declare enum BlockRateSource {
    Random = 0,
    Perlin3D = 1
}
export declare enum BlockReplaceStrategy {
    DontReplace = 0,
    Replace = 1,
    OnlyReplace = 2
}
export interface IBlockPlacement {
    blockType: BlockType;
    placement: number[];
}
export interface IBlocksGenerationRule {
    replace: BlockReplaceStrategy;
    structure: IBlockPlacement[];
    create: IBlockCreationRule[];
}
export interface IBlockCreationRule {
}
export declare const rules: IBlocksGenerationRule[];
