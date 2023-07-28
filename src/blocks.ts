import { BoxGeometry, CylinderGeometry, InstancedBufferGeometry, Object3D } from "three"
import { state } from "./state"

const maxBlockAge = 2
let _blocksCounter = 0

export type FSiblingIteratee = (dx: number, dy: number, dz: number, sibling: Block) => void

export enum BlockShape {
    Cube,
    Prism6
}

export enum BlockType {
    None,
    Gravel,
    Rock,
    Dirt,
    Sand,
    Bedrock,
    Water
}

export interface IBlockTable {
    [x: string]: {
        tile: number[],
    }
}

export const blockTable: IBlockTable = {
    [BlockType.None]: {
        tile: [0, 0],
    },
    [BlockType.Gravel]: {
        tile: [0, 0]
    },
    [BlockType.Rock]: {
        tile: [0, 1]
    },
    [BlockType.Dirt]: {
        tile: [2, 0],
    },
    [BlockType.Sand]: {
        tile: [2, 1]
    },
    [BlockType.Bedrock]: {
        tile: [1, 1]
    },
    [BlockType.Water]: {
        tile: [15, 13]
    }
}

export class Block {
    static getShapeGeometry(): InstancedBufferGeometry {
        switch (state.blockShape) {
            case BlockShape.Prism6: {
                let g = new CylinderGeometry(1, 1, 1, 6) as any as InstancedBufferGeometry
                g.scale(1 / 1.732, 1, 1 / 1.5);
                return g;
            }
            default: {
                return new BoxGeometry(1, 1, 1) as any as InstancedBufferGeometry
            }
        }
    }


    bx: number = null
    by: number = null
    bz: number = null
    bid: string = null
    btype: BlockType = BlockType.None
    instanceIndex: number = null
    lightness: number = 1
    lastUpdate: number = Math.random()
    serial: number = null

    get age() {
        return (+new Date() - this.lastUpdate) / 1000
    }

    get isOutdated(): boolean {
        return this.age > maxBlockAge
    }

    get tileX(): number {
        return blockTable[this.btype].tile[0]
    }

    get tileY(): number {
        return blockTable[this.btype].tile[1]
    }

    constructor({ x, y, z, chunk, lightness, blockType }) {

        if (BlocksManager.getBlockAt(x, y, z)) {
            // return BlocksManager.getBlockAt(x, y, z)
        }

        this.bx = x;
        this.by = y;
        this.bz = z;
        this.bid = BlocksManager.getBlockId(x, y, z);

        this.serial = _blocksCounter
        _blocksCounter++

        BlocksManager.blocks[this.bid] = this


        this.instanceIndex = BlocksManager.getInstanceIndex(
            x - chunk.position.x, y - chunk.position.y, z - chunk.position.z
        )

        this.update({ lightness, blockType })
        this.lastUpdate = 0
    }

    kill() {
        delete BlocksManager.blocks[this.bid]
    }

    iterateSiblings(distance: number = 1, iteratee: FSiblingIteratee) {
        distance = Math.round(distance)
        for (let x = -distance; x <= distance; x++) {
            for (let y = -distance; y <= distance; y++) {
                for (let z = -distance; z <= distance; z++) {
                    iteratee(x, y, z, BlocksManager.getBlockAt(x + this.bx, y + this.by, z + this.bz))
                }
            }
        }
    }
    update({ lightness, blockType }): boolean {
        let changed = (lightness !== this.lightness) || (blockType !== this.btype)
        this.lightness = lightness
        this.btype = blockType
        this.lastUpdate = +new Date()
        return changed
    }
}


export class BlocksManager {
    static blocks: {
        [x: string]: Block
    } = {}

    static getBlockId(bx: number, by: number, bz: number): string {
        return `${Math.round(bx)}_${Math.round(by)}_${Math.round(bz)}`
    }
    static getMostElevatedBlockAt(x: number, z: number): Block {
        let r: Block = null

        for (let i = 0; i < state.worldHeight; i++) {
            let b = BlocksManager.getBlockAt(x, i, z)
            if (b) {
                r = b
            }
        }

        return r
    }
    static getElevationAt(x: number, z: number): number {
        let r: number = 0

        for (let i = 0; i < state.worldHeight; i++) {
            let b = BlocksManager.getBlockAt(x, i, z)
            if (b) {
                r = i
            }
        }

        return r
    }
    static getBlockAt(x: number, y: number, z: number): Block {
        return BlocksManager.blocks[BlocksManager.getBlockId(x, y, z)]
    }
    static getInstanceIndex(x, y, z): number {
        return Math.floor(x + state.chunkSize * (y + state.worldHeight * z))
        // let  index = 0;
        // for (let ix = 0; ix < x; ix++){
        //     for (let iz = 0; iz < z; iz++){
        //         for (let iy = 0; iy < y; iy++){
        //             index++
        //         }
        //     }
        // }
        // return index
    }
    static get maxBlocksPerChunk(): number {
        return state.chunkSize * state.chunkSize * state.worldHeight
    }
}
