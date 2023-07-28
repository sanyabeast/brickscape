import { BlockType } from "./blocks"

export enum BlockRateSource {
    Random,
    Perlin3D,
}

export enum BlockReplaceStrategy {
    DontReplace,
    Replace,
    OnlyReplace
}

export interface IBlockPlacement {
    blockType: BlockType
    placement: number[]
}

export interface IBlocksGenerationRule {
    replace: BlockReplaceStrategy
    structure: IBlockPlacement[]
    create: IBlockCreationRule[]
}

export interface IBlockCreationRule {

}

function getSingleBlockStructure(blockType: BlockType): IBlockPlacement[] {
    return [{
        blockType,
        placement: [0, 0]
    }]
}

export const rules: IBlocksGenerationRule[] = [
    // filler
    {
        replace: BlockReplaceStrategy.Replace,
        structure: getSingleBlockStructure(BlockType.None),
        create: [
            {
                
            }
        ]
    }
]