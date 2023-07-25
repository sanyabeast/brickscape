import { DirectionalLight, Group, TextureLoader, EquirectangularReflectionMapping, SRGBColorSpace, HemisphereLight } from "three";
import { RGBELoader } from 'three/addons/loaders/RGBELoader.js';

const textureLoader = new TextureLoader();
const rgbeLoader = new RGBELoader()

export class Environment extends Group {
    sun = null

    constructor({ scene, camera, renderer }) {
        super()

        const sun = this.sun = new DirectionalLight()
        sun.position.set(1, 4, 1)
        scene.add(sun)

        // 
        const ambient = new HemisphereLight(0xffff00, 0x0000ff)
        scene.add(ambient)

        let envMap = rgbeLoader.load('assets/hdr/lenong.hdr', () => {
            envMap.mapping = EquirectangularReflectionMapping;
            envMap.colorSpace = SRGBColorSpace;

            scene.background = envMap;
            scene.environment = envMap;

            scene.backgroundBlurriness = 1
        });
    }
}