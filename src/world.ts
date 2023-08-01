import { isNumber } from "lodash"
import { Block, BlockType, blockManager } from "./blocks"
import { generationHelper } from "./generator"
import { EBlockCreationSource, EBlockReplacingStrategy, IBlockCreationLevels, IBlockCreationRule, IBlockPlacement, rules } from "./rules"
import { featureLevel, state } from "./state"
import { QueueType, tasker } from "./tasker"
import { clamp, distance, getChunkId, lerp } from "./utils"

export class WorldManager {
    static instance: WorldManager = null
    static getInstance(): WorldManager {
        if (WorldManager.instance === null) {
            WorldManager.instance = new WorldManager()
        }

        return WorldManager.instance
    }

    get needsUpdate() {
        return this.updatedChunks.length > 0
    }

    _chunksGeneratedStatus: { [x: string]: boolean } = null
    updatedChunks: number[][] = null

    constructor() {
        this.updatedChunks = []
        this._chunksGeneratedStatus = {}
    }
    checkChunkGeneration(cx: number, cz: number): boolean {
        let chunkId = getChunkId(cx, cz)
        if (this._chunksGeneratedStatus[chunkId] === undefined) {
            this._chunksGeneratedStatus[chunkId] = false
            tasker.add((done) => {
                this._genrateChunkWithRules(cx, cz)
                this._chunksGeneratedStatus[chunkId] = true
                done()
            }, ['world', 'generate', getChunkId(cx, cz)], QueueType.Normal)
            tasker.add((done) => {
                this._updateChunkLighting(cx, cz)
                done()
            }, ['world', 'generate', 'shading', getChunkId(cx, cz)], QueueType.Post, false)
            return false
        } else {
            tasker.add((done) => {
                this._updateChunkLighting(cx, cz)
                done()
            }, ['world', 'generate', 'shading', getChunkId(cx, cz)], QueueType.Post, false)
            return true
        }
    }

    cancel() {
        tasker.flush(['world', 'generate'])
        for (let k in this._chunksGeneratedStatus) {
            if (this._chunksGeneratedStatus[k] === false) {
                this._chunksGeneratedStatus[k] = undefined
            }
        }
    }

    _genrateChunkWithRules(cx: number, cz: number) {
        rules.forEach((rule, index) => {
            for (let ir = 0; ir < rule.create.length; ir++) {
                let creationRule: IBlockCreationRule = rule.create[ir]
                creationRule.levels.forEach((level: IBlockCreationLevels) => {
                    let levelHeight = level.max - level.min
                    blockManager.traverseChunk2D(cx, cz, (x, z) => {
                        let blocksRatio = this._getBlocksRatioForRule(x, z, creationRule);
                        let blocksCount = blocksRatio * levelHeight
                        blocksCount = clamp(blocksCount, 0, state.worldHeight)
                        blocksCount = clamp(blocksCount, 0, levelHeight);

                        let stackOffset = creationRule.stack ? -clamp(level.min - blockManager.getElevationAt(x, z) - 1, 0, level.min) : 0

                        for (let y = level.min + stackOffset; y < level.min + blocksCount + stackOffset; y++) {
                            let replaceAllowed: boolean = this._testReplaceRestrictions(x, y, z, creationRule)

                            if (rule.name === 'clear'){
                                console.log(replaceAllowed  )
                            }


                            if (replaceAllowed) {
                                this._placeStructure(x, y, z, rule.structure, creationRule.replace)
                            }

                        }
                    })
                })
            }
        })

        this._cleanChunk(cx, cz)
    }

    _cleanChunk(cx: number, cz: number) {
        blockManager.traverseChunk(cx, cz, (x, y, z, block) => {
            if (block && block.btype === BlockType.None) {
                blockManager.removeBlock(block)
            }
        })
    }

    _testReplaceRestrictions(x: number, y: number, z: number, creationRule: IBlockCreationRule): boolean {
        let elevation = blockManager.getElevationAt(x, z)
        let stackOffset = creationRule.stack ? 1 : 0
        elevation = clamp(elevation - stackOffset, 0, state.worldHeight - 1)

        if (elevation > 0) {
            let block: Block = blockManager.getBlockAt(x, elevation, z)

            if (creationRule.replaceInclude) {
                if (!block) {
                    return false
                }
                let included = false
                for (let i = 0; i < creationRule.replaceInclude.length; i++) {
                    if (block.btype === creationRule.replaceInclude[i]) {
                        included = true
                        break
                    }
                }
                return included
            }

            if (creationRule.replaceExclude) {
                if (!block) {
                    return true
                }

                let excluded = false
                for (let i = 0; i < creationRule.replaceExclude.length; i++) {
                    if (block.btype === creationRule.replaceExclude[i]) {
                        excluded = true;
                        break
                    }
                }

                return !excluded
            }

            return true
        } else {
            return true
        }
    }


    _placeStructure(x: number, y: number, z: number, structure: IBlockPlacement[], replaceStrategy: EBlockReplacingStrategy) {
        structure.forEach((placement: IBlockPlacement, index) => {
            this._placeBlock(x + placement.offset[0], y + placement.offset[1], z + placement.offset[2], placement.blockType, replaceStrategy)
        })
    }

    _placeBlock(x, y, z, blockType: BlockType, replaceStrategy: EBlockReplacingStrategy) {
        // console.log(x, y, z)
        switch (replaceStrategy) {
            case EBlockReplacingStrategy.Replace: {
                new Block({
                    chunk: this,
                    x: x,
                    y: y,
                    z: z,
                    lightness: 1,
                    blockType: blockType
                })
            }
            case EBlockReplacingStrategy.DontReplace: {
                if (!blockManager.getBlockAt(x, y, z)) {
                    new Block({
                        chunk: this,
                        x: x,
                        y: y,
                        z: z,
                        lightness: 1,
                        blockType: blockType
                    })
                }
                break;
            }
            case EBlockReplacingStrategy.OnlyReplace: {
                if (blockManager.getBlockAt(x, y, z)) {
                    new Block({
                        chunk: this,
                        x: x,
                        y: y,
                        z: z,
                        lightness: 1,
                        blockType: blockType
                    })
                }
                break;
            }
            // case EBlockReplacingStrategy.Stack: {
            //     let elevation = blockManager.getElevationAt(x, z)
            //     if (elevation < state.worldHeight - 1) {
            //         new Block({
            //             chunk: this,
            //             x: x,
            //             y: elevation + 1,
            //             z: z,
            //             lightness: 1,
            //             blockType: blockType
            //         })
            //     }
            //     break;
            // }
        }

    }

    _getBlocksRatioForRule(x: number, z: number, creationRule: IBlockCreationRule): number {
        switch (creationRule.source) {
            case EBlockCreationSource.Simplex: {
                return generationHelper.simplex(x, z, creationRule.params)
            }
            case EBlockCreationSource.Perlin: {
                return generationHelper.perlin(x, z, creationRule.params)
            }
            case EBlockCreationSource.Constant: {
                return 1
            }
            default: {
                return 0;
            }
        }
    }

    _updateChunkLighting(cx: number, cz: number) {
        // shading 

        blockManager.traverseChunk(cx, cz, (x, y, z, block) => {
            if (block) {
                let lightness = 1


                if (block.isLightSource) {
                    lightness = 1.5;
                } else {
                    let sibDistance = 2
                    block.iterateSiblings(sibDistance, (dx, dy, dz, block) => {
                        if (block) {
                            if (!block.isLightSource) {
                                let shadingFactor = 0
                                if (dy >= 1) {
                                    shadingFactor += Math.pow((dy + sibDistance) / (sibDistance * 2), 1.5)
                                    shadingFactor += Math.pow(Math.abs(dx) / sibDistance, 1.5)
                                    shadingFactor += Math.pow(Math.abs(dy) / sibDistance, 1.5)
                                    shadingFactor += Math.pow(Math.abs(dz) / sibDistance, 1.5)
                                    shadingFactor /= 4
                                }
                                lightness *= lerp(1, 0.95, shadingFactor);
                            }

                        }
                    })
                }


                let blockChanged = block.update({
                    lightness,
                    blockType: block.btype
                })
            }
        })

        this.updatedChunks.push([cx, cz])

    }
}

export const worldManager = WorldManager.getInstance()