import { Block, BlockType, blockManager } from "./blocks"
import { generationHelper } from "./generator"
import { EBlockCreationSource, EBlockReplacingStrategy, IBlockCreationLevels, IBlockCreationRule, IBlockPlacement, rules } from "./rules"
import { featureLevel, state } from "./state"
import { QueueType, tasker } from "./tasker"
import { getChunkId, lerp, logd } from "./utils"

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
                blockManager.traverseChunk(cx, cz, (x, y, z, block) => {
                    if (this._testLevels(y, creationRule.levels)) {
                        if (this._testCreationRule(x, y, z, creationRule)) {
                            this._placeStructure(x, y, z, rule.structure, creationRule.replace)
                        }
                    }

                })
            }
        })
    }

    _placeStructure(x: number, y: number, z: number, structure: IBlockPlacement[], replaceStrategy: EBlockReplacingStrategy) {
        structure.forEach((placement: IBlockPlacement, index) => {
            this._placeBlock(x + placement.offset[0], y + placement.offset[1], z + placement.offset[1], placement.blockType, replaceStrategy)
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
            case EBlockReplacingStrategy.Stack: {
                let elevation = blockManager.getElevationAt(x, z)
                if (elevation < state.worldHeight) {
                    new Block({
                        chunk: this,
                        x: x,
                        y: elevation + 1,
                        z: z,
                        lightness: 1,
                        blockType: blockType
                    })
                }
                break;
            }
        }

    }

    _testLevels(y: number, levels: IBlockCreationLevels[]): boolean {
        for (let i = 0; i < levels.length; i++) {
            let level = levels[i]
            if (y >= level.min && y < level.max) {
                return true
            }
        }
        return false
    }

    _testCreationRule(x: number, y: number, z: number, creationRule: IBlockCreationRule): boolean {
        switch (creationRule.source) {
            case EBlockCreationSource.Perlin3D: {
                return generationHelper.getPerlin3DNoise(x, z, null, creationRule.params) < creationRule.ratio
            }
            case EBlockCreationSource.Perlin4D: {
                return generationHelper.getPerlin4DNoise(x, z, y, creationRule.params) < creationRule.ratio
            }
            case EBlockCreationSource.Constant: {
                return true
            }
            default: {
                return false;
            }
        }
    }

    _generateChunk(cx: number, cz: number) {
        logd('WorldManager._generateChunk', `start generating at [${cx}, ${cz}]`)
        // bedrock level
        blockManager.traverseChunk2D(cx, cz, (x, z) => {
            new Block({
                chunk: this,
                x: x,
                y: 0,
                z: z,
                lightness: 1,
                blockType: BlockType.Bedrock
            })
        })

        // main perlin noise
        blockManager.traverseChunk2D(cx, cz, (x, z) => {
            let noiseValue = state.generator.getPerlin3DNoise(
                x,
                z,
                null,
                {
                    paramA: 4
                })

            let heightValue = Math.floor(state.worldHeight * noiseValue) + 1

            for (let i = 1; i < heightValue - 1; i++) {
                new Block({
                    chunk: this,
                    x: x,
                    y: i,
                    z: z,
                    lightness: 1,
                    blockType: BlockType.None
                })
            }
        })

        // watering

        let waterLevel = 2

        blockManager.traverseChunk2D(cx, cz, (x, z) => {
            let existingBlock = blockManager.getBlockAt(x, waterLevel, z)
            if (!existingBlock) {
                new Block({
                    chunk: this,
                    x: x,
                    y: waterLevel,
                    z: z,
                    lightness: 1,
                    blockType: BlockType.Water
                })
            }
        })

        // types 

        blockManager.traverseChunk(cx, cz, (x, y, z, block) => {
            if (block) {
                if (block.btype === BlockType.None) {
                    let blockType = BlockType.Dirt;
                    if (block.by < 8 && Math.random() > 0.8) {
                        blockType = BlockType.Rock
                    } else if (block.by < 6 && Math.random() > 0.9) {
                        blockType = BlockType.Gravel
                    } else if (block.by < 6) {
                        blockType = BlockType.Sand
                    }

                    let blockChanged = block.update({
                        lightness: block.lightness,
                        blockType
                    })
                }
            }
        })


        this.updatedChunks.push([cx, cz])
    }

    _updateChunkLighting(cx: number, cz: number) {
        // shading 

        blockManager.traverseChunk(cx, cz, (x, y, z, block) => {
            if (block) {
                let lightness = 1
                let sibDistance = 2
                block.iterateSiblings(sibDistance, (dx, dy, dz, block) => {
                    if (block) {
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
                })

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