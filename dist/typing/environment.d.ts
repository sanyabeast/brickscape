import { DirectionalLight, Group, FogExp2, Light, AmbientLight, Object3D } from "three";
export declare class Environment extends Group {
    sun: DirectionalLight;
    ambient: AmbientLight;
    fog: FogExp2;
    daytime: number;
    dayspeed: number;
    sunRotationRadius: number;
    sunElevation: number;
    minSunIntensity: number;
    maxSunIntensity: number;
    minAmbIntensity: number;
    maxAmbIntensity: number;
    constructor();
    update(): void;
    static addFlares(light: Light, scene: Object3D, count?: number, sizeScale?: number): void;
}
