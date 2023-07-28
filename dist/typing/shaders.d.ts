import { ShaderMaterial } from "three";
export declare class VoxelBlockMaterial extends ShaderMaterial {
    constructor({ color }: {
        color: any;
    });
    set color(v: any);
    get color(): any;
}
