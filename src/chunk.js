import { Group, Mesh, BoxGeometry, MeshBasicMaterial } from "three"
import { getChunkId } from "./utils"
import { state } from "./state"

export class Chunk extends Group {
    chunkId = null
    cx = null
    cz = null
    createdAt = null
    active = false

    constructor({ cx, cz }) {
        super()
        this.cx = cx
        this.cz = cz
        this.chunkId = getChunkId(cx, cz)
        this.createdAt = +new Date()

        this.position.set(cx * state.chunkSize, 0, cz * state.chunkSize)

        this._buildChunk()

    }

    _buildChunk() {
        const boxWidth = 0.5;
        const boxHeight = 0.5;
        const boxDepth = 0.5;
        const geometry = new BoxGeometry(boxWidth, boxHeight, boxDepth);
        const material = new MeshBasicMaterial({ color: 0x44aa88 });
        let cx = this.cx
        let cy = this.cy

        for (let y = 0; y < state.chunkSize; y++) {
            for (let x = 0; x < state.chunkSize; x++) {
                let cube = new Mesh(geometry, material)
                console.log(x, y)
                cube.position.set(x, 0, y)
                this.add(cube);
            }
        }


    }

    update() {

    }
    isSameChunk(cx, cz) {
        return cx === this.cx && cz === this.cz
    }
}