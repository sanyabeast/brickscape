import { BlockType } from "./blocks"
import { state } from "./state"

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
    Perlin3D,
    Perlin4D
}

export interface IBlockCreationSourceParams {
    paramA?: number
    paramB?: number
    paramC?: number
    /**seed */
    paramD?: number
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
                source: EBlockCreationSource.Perlin4D,
                ratio: 0.4,
                replace: EBlockReplacingStrategy.Stack,
                levels: [{
                    min: 0,
                    max: 4
                }],
                params: { paramA: 4, paramB: 0.003, paramC: 1, paramD: 0 }
            },
            {
                source: EBlockCreationSource.Perlin4D,
                ratio: 0.3,
                replace: EBlockReplacingStrategy.Stack,
                levels: [{
                    min: 0,
                    max: 4
                }],
                params: { paramA: 6, paramB: 0.01, paramC: 1, paramD: 0 }
            }
        ]
    },

    {
        structure: getSingleBlockStructure(BlockType.Gravel),
        create: [
            {
                source: EBlockCreationSource.Perlin4D,
                ratio: 0.25,
                replace: EBlockReplacingStrategy.Stack,
                levels: [{
                    min: 2,
                    max: 8
                }],
                params: { paramA: 6, paramB: 0.008, paramC: 1, paramD: 1214 }
            },
            {
                source: EBlockCreationSource.Perlin4D,
                ratio: 0.25,
                replace: EBlockReplacingStrategy.Stack,
                levels: [{
                    min: 2,
                    max: 6
                }],
                params: { paramA: 6, paramB: 0.02, paramC: 1, paramD: 123 }
            }
        ]
    },

    {
        structure: getSingleBlockStructure(BlockType.Dirt),
        create: [
            {
                source: EBlockCreationSource.Perlin4D,
                ratio: 0.5,
                replace: EBlockReplacingStrategy.Stack,
                levels: [{
                    min: 8,
                    max: state.worldHeight
                }],
                params: { paramA: 4, paramB: 0.002, paramC: 1, paramD: 665 }
            }
        ]
    },

    {
        structure: getSingleBlockStructure(BlockType.Sand),
        create: [
            {
                source: EBlockCreationSource.Constant,
                ratio: 0.5,
                replace: EBlockReplacingStrategy.OnlyReplace,
                levels: [{
                    min: 4,
                    max: 5
                }],
                params: {}
            }
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
                    min: 3,
                    max: 4
                }],
                params: {}
            }
        ]
    },

    {
        structure: [
            { blockType: BlockType.Rock, offset: [0, 0] },
            { blockType: BlockType.Rock, offset: [1, 0] },
            { blockType: BlockType.Rock, offset: [0, 1] },
            { blockType: BlockType.Rock, offset: [1, 1] },
        ],
        create: [
            {
                source: EBlockCreationSource.Perlin4D,
                ratio: 0.2,
                replace: EBlockReplacingStrategy.OnlyReplace,
                levels: [{
                    min: 6,
                    max: state.worldHeight
                }],
                params: { paramA: 4, paramB: 0.4, paramC: 1, paramD: 212 }
            }
        ]
    },

    {
        structure: [
            { blockType: BlockType.Gravel, offset: [0, 0] },
            { blockType: BlockType.Rock, offset: [1, 0] },
            { blockType: BlockType.Sand, offset: [0, 1] },
            { blockType: BlockType.Dirt, offset: [1, 1] },
        ],
        create: [
            {
                source: EBlockCreationSource.Perlin4D,
                ratio: 0.4,
                replace: EBlockReplacingStrategy.OnlyReplace,
                levels: [{
                    min: 5,
                    max: state.worldHeight / 2
                }],
                params: { paramA: 4, paramB: 0.4, paramC: 1, paramD: 115 }
            }
        ]
    },

]