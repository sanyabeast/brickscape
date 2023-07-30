import { Group, Vector2, Vector3, Raycaster, Plane } from "three";
import { getNearestMultiple, logd } from "./utils";
import { state } from "./state"
import { Chunk } from "./chunk";
import { monitoringData } from "./gui";
import { worldManager } from "./world";


let _groundPlane = new Plane(new Vector3(0, 1, 0), 0);
let _intersection = new Vector3();
let _raycaster = new Raycaster();

export function getCameraLookIntersection(camera) {
    _raycaster.setFromCamera(new Vector2(0, 0), camera);
    _raycaster.ray.intersectPlane(_groundPlane, _intersection);
    return _intersection;
}

export class MapManager extends Group {
    camera = null
    activeChunk = null
    _activeChunks: Chunk[]

    constructor({ camera }) {
        super();
        this.camera = camera
        this.activeChunk = [null, null]
        this._activeChunks = []
    }
    update() {
        let cameraLook = getCameraLookIntersection(this.camera)
        let cx = getNearestMultiple(cameraLook.x, state.chunkSize) / state.chunkSize
        let cz = getNearestMultiple(cameraLook.z, state.chunkSize) / state.chunkSize

        if (cx !== this.activeChunk[0] || cz != this.activeChunk[1]) {
            this.activeChunk[0] = cx
            this.activeChunk[1] = cz
            monitoringData.activeChunk = this.activeChunk.join(':')
            this._onActiveChunkChanged();
        }

        if (worldManager.needsUpdate) {
            this._syncChunks()
        }
    }

    _syncChunks(allChunks: boolean = false) {
        if (allChunks) {
            this._activeChunks.forEach((chunk: Chunk) => chunk.sync())
        } else {
            let chunkToUpdate = worldManager.updatedChunks.pop()
            let cx = chunkToUpdate[0]
            let cz = chunkToUpdate[1]

            this._activeChunks.forEach((chunk: Chunk) => {
                if (cx === chunk.cx && cz === chunk.cz) {
                    chunk.sync()
                }
            })
        }
    }

    _onActiveChunkChanged() {
        let cx = this.activeChunk[0]
        let cz = this.activeChunk[1]
        logd(`MapManager._onActiveChunkChanged`, `new active chunk: [${cx}, ${cz}]`)

        worldManager.cancel()

        this._activeChunks.forEach((chunk) => {
            let isOutOfDrawDistance = chunk.cx < (cx - state.drawChunks) ||
                chunk.cx > (cx + state.drawChunks) ||
                chunk.cz < (cz - state.drawChunks) ||
                chunk.cz > (cz + state.drawChunks);

            if (isOutOfDrawDistance) {
                Chunk.unload(chunk)
            }
        })

        this._activeChunks = []

        // for (let z = -state.drawChunks; z <= state.drawChunks; z++) {
        //     for (let x = -state.drawChunks; x <= state.drawChunks; x++) {
        //         this._activeChunks.push(Chunk.load(cx + x, cz + z))
        //     }
        // }

        for (let z = 0; z < state.drawChunks; z++) {
            for (let x = 0; x < state.drawChunks; x++) {
                if (x === 0 && z === 0) {
                    this._activeChunks.push(Chunk.load(cx + x, cz + z))
                } else {
                    this._activeChunks.push(Chunk.load(cx + x, cz + z))
                    this._activeChunks.push(Chunk.load(cx - x, cz + z))
                    this._activeChunks.push(Chunk.load(cx + x, cz - z))
                    this._activeChunks.push(Chunk.load(cx - x, cz - z))
                }

            }
        }

        this.children = this._activeChunks
    }
}