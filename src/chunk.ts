import { Group, Mesh, BoxGeometry, MeshBasicMaterial, MeshPhongMaterial, MeshStandardMaterial, MeshLambertMaterial } from "three"
import { getBlockId, getChunkId, getRandomHexColor } from "./utils"
import { state } from "./state"
import { debounce } from "lodash"

const blockGeometry = new BoxGeometry(1, 1, 1);

export class Block extends Mesh {
    blockX: number = null
    blockY: number = null
    blockZ: number = null
    blockId: string = null
    override material: MeshLambertMaterial
    constructor({ chunk, x, y, z }) {
        const geometry = blockGeometry;
        // const material = new MeshBasicMaterial({ color: getRandomHexColor() });
        const material = new MeshLambertMaterial({ color: getRandomHexColor()});
        super(geometry, material);

        this.blockX = x + chunk.cx;
        this.blockY = y;
        this.blockZ = z + chunk.cz;
        this.blockId = getBlockId(x + chunk.cx, y, z + chunk.cz);
        this.position.set(x, y, z)
        state.blocks[this.blockId] = this
        chunk.add(this);
    }

    kill() {
        this.geometry.dispose()
        delete state.blocks[this.blockId]
    }
}

export class Chunk extends Group {
    chunkId = null
    cx = null
    cz = null
    createdAt = null
    active = false
    blocks = null

    constructor({ cx, cz }) {
        super()
        this.cx = cx
        this.cz = cz
        this.chunkId = getChunkId(cx, cz)
        this.createdAt = +new Date()
        this.blocks = []

        this.position.set(cx * state.chunkSize, 0, cz * state.chunkSize)

        this.matrixAutoUpdate = false

        this.visible = false
        this._buildChunk()
        this.updateMatrix()
        this.visible = true
        this.refresh = debounce(this.refresh.bind(this), 250)

    }

    refresh() {
        this._updateBlocksMaterials()
    }

    _buildChunk() {
        for (let z = 0; z < state.chunkSize; z++) {
            for (let x = 0; x < state.chunkSize; x++) {
                let noiseValue = state.generator.sine.getNoiseValue({
                    x: x + (this.cx * state.chunkSize),
                    y: z + (this.cz * state.chunkSize),
                    scale: 0.01,
                    iterations: 32
                })

                let heightValue = Math.floor(state.worldHeight * noiseValue) + 1

                for (let i = 0; i < heightValue; i++) {
                    let blockId = getBlockId(x + (this.cx * state.chunkSize), i, z + (this.cz * state.chunkSize))
                    if (state[blockId] === undefined) {
                        this.blocks.push(new Block({
                            chunk: this,
                            x: x,
                            y: i,
                            z: z
                        }))
                    } else {
                        console.log(state[blockId])
                    }

                }
            }
        }

        this._updateBlocksMaterials()
    }

    _updateBlocksMaterials() {
        for (let k in state.blocks) {
            let block = state.blocks[k]
            // let siblings = this.getSiblings(block.blockX, block.blockY, block.blockZ)

            // let darkness = siblings.length / this.getMaxSiblingsCount()
            // // console.log(darkness)
            // let bright = (1 - darkness)
            // block.material.color.setRGB(bright, bright, bright)

            let blockElevation = block.blockY
            let darkness = (blockElevation + 1) / state.worldHeight
            block.material.color.setRGB(darkness, darkness, darkness)
        }
    }

    getMaxSiblingsCount() {
        return 6
    }

    getSiblings(bx, by, bz) {
        let siblings = []

        if (state.blocks[getBlockId(bx + 1, by, bz)]) {
            siblings.push(state.blocks[getBlockId(bx + 1, by, bz)])
        }

        if (state.blocks[getBlockId(bx - 1, by, bz)]) {
            siblings.push(state.blocks[getBlockId(bx - 1, by, bz)])
        }

        if (state.blocks[getBlockId(bx, by + 1, bz)]) {
            siblings.push(state.blocks[getBlockId(bx, by + 1, bz)])
        }

        if (state.blocks[getBlockId(bx, by - 1, bz)]) {
            siblings.push(state.blocks[getBlockId(bx, by - 1, bz)])
        }

        if (state.blocks[getBlockId(bx, by, bz + 1)]) {
            siblings.push(state.blocks[getBlockId(bx, by, bz + 1)])
        }

        if (state.blocks[getBlockId(bx, by, bz - 1)]) {
            siblings.push(state.blocks[getBlockId(bx, by, bz - 1)])
        }


        return siblings
    }

    update() {

    }
    isSameChunk(cx, cz) {
        return cx === this.cx && cz === this.cz
    }
}