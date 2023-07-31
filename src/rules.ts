import { BlockType } from "./blocks"

export enum EBlockReplacingStrategy {
    DontReplace,
    Replace,
    OnlyReplace,
    Stack
}

export interface IBlockPlacement {
    blockType: BlockType
    offset: number[]
}

export interface IBlocksGenerationRule {
    structure: IBlockPlacement[]
    create: IBlockCreationRule[]
}

export enum EBlockCreationSource {
    Constant,
    Simplex3D,
    Simplex4D
}

export interface IBlockCreationSourceParams {
    /** for constant */
    count?: number
    /** for noise */
    scale?: number
    /** for noise */
    iterations?: number
    /** for noise */
    scaleStep?: number,
    /** for 4D noises */
    time?: number
}

export interface IBlockCreationLevels {
    min: number
    max: number
}

export interface IBlockCreationRule {
    source: EBlockCreationSource
    ratio: number
    params: IBlockCreationSourceParams
    replace: EBlockReplacingStrategy
    levels: IBlockCreationLevels[]
}

function getSingleBlockStructure(blockType: BlockType): IBlockPlacement[] {
    return [{
        blockType,
        offset: [0, 0]
    }]
}

export const rules: IBlocksGenerationRule[] = [
    // Bedrock
    {
        structure: getSingleBlockStructure(BlockType.Bedrock),
        create: [
            {
                source: EBlockCreationSource.Constant,
                ratio: 0.5,
                replace: EBlockReplacingStrategy.Replace,
                levels: [{
                    min: 0,
                    max: 1
                }],
                params: {}
            }
        ]
    },

    {
        structure: getSingleBlockStructure(BlockType.Rock),
        create: [
            {
                source: EBlockCreationSource.Simplex4D,
                ratio: 0.1,
                replace: EBlockReplacingStrategy.Stack,
                levels: [{
                    min: 0,
                    max: 6
                }],
                params: { scale: 0.05, iterations: 0, scaleStep: 2, time: 1.21331 }
            },
        ]
    },

    {
        structure: getSingleBlockStructure(BlockType.Dirt),
        create: [
            {
                source: EBlockCreationSource.Simplex4D,
                ratio: 0.2,
                replace: EBlockReplacingStrategy.Stack,
                levels: [{
                    min: 4,
                    max: 8
                }],
                params: { scale: 0.1, iterations: 3, scaleStep: 2, time: 5.55454 }
            },
        ]
    },

    {
        structure: getSingleBlockStructure(BlockType.Water),
        create: [
            {
                source: EBlockCreationSource.Constant,
                ratio: 0.5,
                replace: EBlockReplacingStrategy.DontReplace,
                levels: [{
                    min: 1,
                    max: 4
                }],
                params: { count: 3 }
            }
        ]
    },
]