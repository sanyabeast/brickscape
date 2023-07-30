import { Block, BlockType, blockManager } from "./blocks"
import { state } from "./state"
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
            console.log(this._chunksGeneratedStatus, chunkId)
            state.tasker.add((done) => {
                this._generateChunk(cx, cz)
                this._chunksGeneratedStatus[chunkId] = true
                done()
            }, ['world', 'generate'], false)
            return false
        } else {
            return true
        }
    }

    cancel() {
        state.tasker.flush(['world', 'generate'])
        for (let k in this._chunksGeneratedStatus) {
            if (this._chunksGeneratedStatus[k] === false) {
                this._chunksGeneratedStatus[k] = undefined
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
            let noiseValue = state.generator.getNoiseValue({
                x: x,
                y: z,
                scale: 0.01,
                iterations: 32
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