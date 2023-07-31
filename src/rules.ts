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
    replaceInclude?: BlockType[]
    replaceExclude?: BlockType[]
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
                replace: EBlockReplacingStrategy.Replace,
                levels: [{
                    min: 0,
                    max: 1
                }],
                params: {}
            }
        ]
    },

    // {
    //     structure: getSingleBlockStructure(BlockType.Rock),
    //     create: [
    //         {
    //             source: EBlockCreationSource.Simplex,
    //             replace: EBlockReplacingStrategy.Stack,
    //             levels: [{
    //                 min: 0,
    //                 max: 8
    //             }],
    //             params: { scale: 0.1, iterations: 0, scaleStep: 2, time: 1.21331 }
    //         },
    //     ]
    // },

    {
        structure: getSingleBlockStructure(BlockType.Gravel),
        create: [
            {
                source: EBlockCreationSource.Perlin,
                replace: EBlockReplacingStrategy.Stack,
                levels: [{
                    min: 0,
                    max: 8
                }],
                params: { scale: 0.02, iterations: 0, scaleStep: 1.11, seed: 10, addent: -0.3 }
            },
        ]
    },


    {
        structure: getSingleBlockStructure(BlockType.Dirt),
        create: [
            {
                source: EBlockCreationSource.Perlin,
                replace: EBlockReplacingStrategy.Stack,
                levels: [{
                    min: 0,
                    max: 8
                }],
                params: { scale: 0.05, iterations: 0, scaleStep: 1.11, seed: 115, addent: -0.4, multiplier: 1.5 }
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
                    min: 0,
                    max: 3
                }],
                params: { scale: 0.01, iterations: 0, scaleStep: 1.11, seed: 115, addent: 0.5, multiplier: 2 }
            },
        ]
    },

    {
        structure: getSingleBlockStructure(BlockType.Dirt),
        create: [
            {
                source: EBlockCreationSource.Perlin,
                replace: EBlockReplacingStrategy.OnlyReplace,
                levels: [{
                    min: 6,
                    max: state.worldHeight
                }],
                params: { scale: 0.5, iterations: 0, scaleStep: 1.11, seed: 2234, addent: 0.5 }
            },
        ]
    },

    {
        structure: getSingleBlockStructure(BlockType.Rock),
        create: [
            {
                source: EBlockCreationSource.Perlin,
                replace: EBlockReplacingStrategy.Stack,
                levels: [{
                    min: 10,
                    max: state.worldHeight
                }],
                params: { scale: 0.1, iterations: 0, scaleStep: 1.11, seed: 455, addent: -0.9, multiplier: 2 }
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
                    max: 3
                }],
                params: {}
            }
        ]
    },

    {
        structure: getSingleBlockStructure(BlockType.Pumpkin),
        create: [
            {
                source: EBlockCreationSource.Simplex,
                replace: EBlockReplacingStrategy.Stack,
                replaceInclude: [BlockType.Dirt],
                levels: [{
                    min: 10,
                    max: 11
                }],
                params: { scale: 0.5, iterations: 0, scaleStep: 1.11, seed: 455, addent: -0.88, multiplier: 0.6 }
            },
        ]
    },

]