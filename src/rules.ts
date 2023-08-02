import { Block, BlockType } from "./blocks"
import { state } from "./state"
import { structures } from "./structures"

export enum EBlockReplacingStrategy {
    DontReplace,
    Replace,
    OnlyReplace
}

export interface IBlockPlacement {
    blockType: BlockType
    offset: number[]
}

export interface IBlocksGenerationRule {
    name?: string
    structure: IBlockPlacement[]
    create: IBlockCreationRule[]
}

export enum EBlockCreationSource {
    Constant,
    Simplex,
    Perlin
}

export interface IBlockCreationSourceParams {
    seed?: number
    scale?: number
    iterations?: number
    scaleStep?: number,
    multiplier?: number
    addent?: number
}

export interface IBlockCreationLevels {
    min: number
    max: number
}

export interface IBlockCreationRule {

    source: EBlockCreationSource
    params: IBlockCreationSourceParams
    replace: EBlockReplacingStrategy
    stack?: boolean
    replaceInclude?: BlockType[]
    replaceExclude?: BlockType[]
    levels: IBlockCreationLevels[]
}

function getSingleBlockStructure(blockType: BlockType): IBlockPlacement[] {
    return [{
        blockType,
        offset: [0, 0, 0]
    }]
}

export const rules: IBlocksGenerationRule[] = [
    // Bedrock
    {
        structure: getSingleBlockStructure(BlockType.Bedrock),
        create: [
            {
                source: EBlockCreationSource.Constant,
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
        structure: getSingleBlockStructure(BlockType.Dirt),
        create: [
            {
                source: EBlockCreationSource.Perlin,
                replace: EBlockReplacingStrategy.Replace,
                levels: [{
                    min: 1,
                    max: 8
                }],
                stack: true,
                params: { scale: 0.04, iterations: 2, scaleStep: 1.11, seed: 10, addent: -0.3 }
            },
        ]
    },

    {
        structure: getSingleBlockStructure(BlockType.Gravel),
        create: [
            {
                source: EBlockCreationSource.Perlin,
                replace: EBlockReplacingStrategy.Replace,
                levels: [{
                    min: 1,
                    max: 8
                }],
                stack: true,
                params: { scale: 0.04, iterations: 0, scaleStep: 1.11, seed: 123, addent: -0.8 }
            },
        ]
    },

    {
        structure: getSingleBlockStructure(BlockType.Dirt),
        create: [
            {
                source: EBlockCreationSource.Perlin,
                replace: EBlockReplacingStrategy.Replace,
                levels: [{
                    min: 1,
                    max: 8
                }],
                stack: true,
                params: { scale: 0.05, iterations: 0, scaleStep: 1.11, seed: 115, addent: -0.4, multiplier: 1.2 }
            },
        ]
    },

    {
        structure: getSingleBlockStructure(BlockType.Sand),
        create: [
            {
                source: EBlockCreationSource.Perlin,
                replace: EBlockReplacingStrategy.OnlyReplace,
                levels: [{
                    min: 1,
                    max: 4
                }],
                params: { scale: 0.01, iterations: 0, scaleStep: 1.11, seed: 441, addent: 0.5, multiplier: 2 }
            },
        ]
    },

    {
        structure: getSingleBlockStructure(BlockType.Dirt),
        create: [
            {
                source: EBlockCreationSource.Perlin,
                replace: EBlockReplacingStrategy.Replace,
                replaceExclude: [BlockType.Wood, BlockType.Leaves],
                levels: [{
                    min: 6,
                    max: 24
                }],
                stack: true,
                params: { scale: 0.05, iterations: 0, scaleStep: 1.11, seed: 2234, addent: -0.6, multiplier: 1.2 }
            },
        ]
    },

    {
        structure: getSingleBlockStructure(BlockType.Dirt),
        create: [
            {
                source: EBlockCreationSource.Perlin,
                replace: EBlockReplacingStrategy.Replace,
                replaceExclude: [BlockType.Wood, BlockType.Leaves],
                levels: [{
                    min: 6,
                    max: 24
                }],
                stack: true,
                params: { scale: 0.005, iterations: 4, scaleStep: 1.11, seed: 132123, addent: -0.85, multiplier: 1.2 }
            },
        ]
    },

    {
        structure: getSingleBlockStructure(BlockType.Gravel),
        create: [
            {
                source: EBlockCreationSource.Perlin,
                replace: EBlockReplacingStrategy.Replace,
                levels: [{
                    min: 4,
                    max: 8
                }],
                stack: true,
                params: { scale: 0.07, iterations: 0, scaleStep: 1.11, seed: 455, addent: -0.9, multiplier: 2 }
            },
        ]
    },

    {
        structure: getSingleBlockStructure(BlockType.Sand),
        create: [
            {
                source: EBlockCreationSource.Perlin,
                replace: EBlockReplacingStrategy.Replace,
                levels: [{
                    min: 4,
                    max: 8
                }],
                stack: true,
                params: { scale: 0.01, iterations: 2, scaleStep: 1.11, seed: 545, addent: -0.95, multiplier: 1.5 }
            },
        ]
    },


    {
        structure: getSingleBlockStructure(BlockType.Water),
        create: [
            {
                source: EBlockCreationSource.Constant,
                replace: EBlockReplacingStrategy.DontReplace,
                levels: [{
                    min: 1,
                    max: 4
                }],
                params: {}
            }
        ]
    },


    {
        structure: structures['tree.01'],
        create: [
            {
                source: EBlockCreationSource.Simplex,
                replace: EBlockReplacingStrategy.DontReplace,
                replaceInclude: [BlockType.Dirt],
                levels: [{
                    min: 16,
                    max: 17
                }],
                stack: true,
                params: { scale: 0.5, iterations: 0, scaleStep: 1.11, seed: 1233, addent: -0.88, multiplier: 0.5 }
            },
        ]
    },

    {
        structure: structures['tree.02'],
        create: [
            {
                source: EBlockCreationSource.Simplex,
                replace: EBlockReplacingStrategy.Replace,
                replaceInclude: [BlockType.Dirt],
                levels: [{
                    min: 16,
                    max: 24
                }],
                stack: true,
                params: { scale: 0.3, iterations: 0, scaleStep: 1.11, seed: 11313, addent: -0.88, multiplier: 0.5 }
            },
        ]
    },

    {
        structure: getSingleBlockStructure(BlockType.Grass),
        create: [
            {
                source: EBlockCreationSource.Simplex,
                replace: EBlockReplacingStrategy.Replace,
                replaceInclude: [BlockType.Dirt],
                levels: [{
                    min: 23,
                    max: 24
                }],
                stack: true,
                params: { scale: 0.2, iterations: 2, scaleStep: 1.1, seed: 1244, addent: -0.2, multiplier: 3 }
            },
        ]
    },

    {
        structure: [
            {
                blockType: BlockType.Bamboo,
                offset: [0, -1, 0]
            },
            {
                blockType: BlockType.Bamboo,
                offset: [0, 0, 0]
            },
            {
                blockType: BlockType.Bamboo,
                offset: [0, 1, 0]
            },
        ],
        create: [
            {
                source: EBlockCreationSource.Simplex,
                replace: EBlockReplacingStrategy.Replace,
                replaceInclude: [BlockType.Water],
                replaceExclude: [BlockType.Grass],
                levels: [{
                    min: 20,
                    max: 24
                }],
                stack: true,
                params: { scale: 0.2, iterations: 1, scaleStep: 1.2, seed: 412, addent: -0.6, multiplier: 1.6 }
            },
        ]
    },


    {
        structure: getSingleBlockStructure(BlockType.Pumpkin),
        create: [
            {
                source: EBlockCreationSource.Simplex,
                replace: EBlockReplacingStrategy.Replace,
                replaceInclude: [BlockType.Dirt],
                levels: [{
                    min: 50,
                    max: 51
                }],
                stack: true,
                params: { scale: 0.4, iterations: 0, scaleStep: 1.11, seed: 441, addent: -0.95, multiplier: 4 }
            },
        ]
    },
]