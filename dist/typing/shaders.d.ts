import { MeshStandardMaterial, MeshLambertMaterial, Material } from "three";
export declare class VoxelBlockStandardMaterial extends MeshStandardMaterial {
    uniforms: any;
    constructor();
}
export declare class VoxelBlockLamberMaterial extends MeshLambertMaterial {
    uniforms: any;
    constructor();
}
export declare class VoxelBlockPhongMaterial extends MeshLambertMaterial {
    uniforms: any;
    constructor();
}
export declare function getBlockBaseMaterial(): Material;
