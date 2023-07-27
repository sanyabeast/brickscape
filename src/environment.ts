import { DirectionalLight, Group, TextureLoader, EquirectangularReflectionMapping, SRGBColorSpace, HemisphereLight, Fog, FogExp2, Color } from "three";
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader.js';

const textureLoader = new TextureLoader();
const rgbeLoader = new RGBELoader()

export class Environment extends Group {
    sun = null

    constructor({ scene, camera, renderer }) {
        super()

        // 
        const ambient = new HemisphereLight(0xffff00, 0x0000ff)
        scene.add(ambient)

        scene.fog = new FogExp2(new Color(0x00ff00))

        let envMap = rgbeLoader.load('assets/hdr/lenong.hdr', () => {
            envMap.mapping = EquirectangularReflectionMapping;
            envMap.colorSpace = SRGBColorSpace;

            scene.background = envMap;
            scene.environment = envMap;

            scene.backgroundBlurriness = 1
        });
    }
}