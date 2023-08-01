import { BlockType } from "./blocks";
import { generationHelper } from "./generator";
import { IBlockPlacement } from "./rules";

export const structures = {
    "tree.01": createTreeStructure(4, 2, 3),
    "tree.02": createTreeStructure(2, 1, 2),
    "tree.03": createTreeStructure(3, 3, 2)
}

function createTreeStructure(height: number, crownWidth: number, crownHeight: number): IBlockPlacement[] {
    let r = []
    for (let i = 0; i < height; i++) {
        r.push({
            offset: [0, i, 0],
            blockType: BlockType.Wood
        })
    }
    for (let cx = -crownWidth; cx <= crownWidth; cx++) {
        for (let cy = 0; cy <= crownHeight; cy++) {
            for (let cz = -crownWidth; cz <= crownWidth; cz++) {
                if ((cx + cy + cz) % 2 === 0) {
                    r.push({
                        offset: [cx, cy + height - 1, cz],
                        blockType: BlockType.Leaves
                    })
                }
            }
        }
    }
    return r
}