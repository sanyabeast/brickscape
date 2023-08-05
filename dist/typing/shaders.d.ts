import { MeshStandardMaterial, MeshLambertMaterial, Material, MeshToonMaterial, MeshPhysicalMaterial } from "three";
export declare const _perlinNoiseTexture: import("three").Texture;
/**
 * Represents a custom material based on MeshStandardMaterial with voxel rendering capabilities.
 */
export declare class VoxelBlockStandardMaterial extends MeshStandardMaterial {
    uniforms: any;
    constructor();
}
export declare class VoxelBlockPhysicalMaterial extends MeshPhysicalMaterial {
    uniforms: any;
    constructor();
}
/**
 * Represents a custom material based on MeshLambertMaterial with voxel rendering capabilities.
 */
export declare class VoxelBlockLamberMaterial extends MeshLambertMaterial {
    uniforms: any;
    constructor();
}
/**
 * Represents a custom material based on MeshLambertMaterial with voxel rendering capabilities.
 */
export declare class VoxelBlockPhongMaterial extends MeshLambertMaterial {
    uniforms: any;
    constructor();
}
export declare class VoxelBlockToonMaterial extends MeshToonMaterial {
    uniforms: any;
    constructor();
}
/**
 * Get the base material for rendering voxel blocks based on the current feature level.
 * @returns {Material} - The base material.
 */
export declare function getBlockBaseMaterial(): Material;
export declare function updateGlobalUniforms(): void;
