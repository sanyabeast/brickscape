import { ShaderMaterial } from "three";
export declare class VoxelBlockMaterial extends ShaderMaterial {
    constructor({ color, maxInstances, state }: {
        color: any;
        maxInstances: any;
        state: any;
    });
    set color(v: any);
    get color(): any;
}
