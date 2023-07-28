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

export interface BlockPlacement {
    blockType: BlockType
    placement: number[]
}

export interface IGenerationRule {
    replace: BlockReplaceStrategy
    structure: BlockPlacement[]
}

function getSingleBlockStructure(blockType: BlockType): BlockPlacement[] {
    return [{
        blockType,
        placement: [0, 0]
    }]
}

export const rules: IGenerationRule[] = [
    // filler
    {
        replace: BlockReplaceStrategy.Replace,
        structure: getSingleBlockStructure(BlockType.None)
    }
]