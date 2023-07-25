import { Group, Mesh, BoxGeometry, MeshBasicMaterial, MeshPhongMaterial, MeshStandardMaterial } from "three"
import { getBlockId, getChunkId, getRandomHexColor } from "./utils"
import { state } from "./state"
import { debounce } from "lodash"

const generationHeight = 8

export class Chunk extends Group {
    chunkId = null
    cx = null
    cz = null
    createdAt = null
    active = false
    get blocks() {
        return state.blocks
    }

    constructor({ cx, cz }) {
        super()
        this.cx = cx
        this.cz = cz
        this.chunkId = getChunkId(cx, cz)
        this.createdAt = +new Date()

        this.position.set(cx * state.chunkSize, 0, cz * state.chunkSize)

        this._buildChunk()
        this.refresh = debounce(this.refresh.bind(this), 250)

    }

    refresh() {
        this._updateBlocksMaterials()
    }

    _buildChunk() {
        const boxWidth = 1;
        const boxHeight = 1;
        const boxDepth = 1;
        const geometry = new BoxGeometry(boxWidth, boxHeight, boxDepth);
        // const material = new MeshBasicMaterial({ color: getRandomHexColor() });
        const material = new MeshStandardMaterial({ color: getRandomHexColor(), envMapIntensity: 0.5 });
        let cx = this.cx

        for (let z = 0; z < state.chunkSize; z++) {
            for (let x = 0; x < state.chunkSize; x++) {
                let noiseValue = state.sine.getNoiseValue({
                    x: x + (this.cx * state.chunkSize),
                    y: z + (this.cz * state.chunkSize),
                    scale: 0.01,
                    iterations: 32
                })

                let heightValue = Math.floor(generationHeight * noiseValue) + 1

                // let cube = new Mesh(geometry, material)
                // console.log(x, y)
                // cube.position.set(x, heightValue, y)
                // this.add(cube);

                for (let i = 0; i < heightValue; i++) {
                    let blockId = getBlockId(x + (this.cx * state.chunkSize), i, z + (this.cz * state.chunkSize))
                    if (this.blocks[blockId] === undefined) {
                        let cube = new Mesh(geometry, material.clone())
                        cube.position.set(x, i, z)
                        cube.blockId = blockId
                        cube.blockX = x + (this.cx * state.chunkSize)
                        cube.blockY = i
                        cube.blockZ = z + (this.cz * state.chunkSize)
                        this.blocks[blockId] = cube
                        this.add(cube);
                    } else {
                        console.log(this.blocks[blockId])
                    }

                }
            }
        }

        this._updateBlocksMaterials()
    }

    _updateBlocksMaterials() {
        for (let k in this.blocks) {
            let block = this.blocks[k]
            let siblings = this.getSiblings(block.blockX, block.blockY, block.blockZ)

            if (siblings.length == this.getMaxSiblingsCount()) {
                block.visible = false
            } else {
                block.visible = true
                let darkness = siblings.length / this.getMaxSiblingsCount()
                // console.log(darkness)
                let bright = (1 - darkness) / 3
                block.material.color.setRGB(bright, bright, bright)
            }
        }
    }



    getMaxSiblingsCount() {
        return 6
    }

    getSiblings(bx, by, bz) {
        let siblings = []

        if (this.blocks[getBlockId(bx + 1, by, bz)]) {
            siblings.push(this.blocks[getBlockId(bx + 1, by, bz)])
        }

        if (this.blocks[getBlockId(bx - 1, by, bz)]) {
            siblings.push(this.blocks[getBlockId(bx - 1, by, bz)])
        }

        if (this.blocks[getBlockId(bx, by + 1, bz)]) {
            siblings.push(this.blocks[getBlockId(bx, by + 1, bz)])
        }

        if (this.blocks[getBlockId(bx, by - 1, bz)]) {
            siblings.push(this.blocks[getBlockId(bx, by - 1, bz)])
        }

        if (this.blocks[getBlockId(bx, by, bz + 1)]) {
            siblings.push(this.blocks[getBlockId(bx, by, bz + 1)])
        }

        if (this.blocks[getBlockId(bx, by, bz - 1)]) {
            siblings.push(this.blocks[getBlockId(bx, by, bz - 1)])
        }


        return siblings
    }

    update() {

    }
    isSameChunk(cx, cz) {
        return cx === this.cx && cz === this.cz
    }
}