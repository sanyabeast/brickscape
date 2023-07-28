import { DirectionalLight, Group, FogExp2, Light, Scene } from "three";
export declare class Environment extends Group {
    sun: DirectionalLight;
    fog: FogExp2;
    daytime: number;
    dayspeed: number;
    sunRotationRadius: number;
    sunElevation: number;
    minSunIntensity: number;
    maxSunIntensity: number;
    minEnvIntensity: number;
    maxEnvIntensity: number;
    constructor({ scene, camera, renderer }: {
        scene: any;
        camera: any;
        renderer: any;
    });
    update(frameDelta: number): void;
    static addFlares(light: Light, scene: Scene, count?: number): void;
}
