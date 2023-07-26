import { PerspectiveCamera, WebGLRenderer, Scene } from 'three';
import { VoxelMapControls } from './controls';
import { VoxelMap } from './map';
import { createGui } from './gui';
import { state } from './state'
import { Environment } from './environment';
import { VoxelWorldGenerator } from './generator';


function main() {

    state.generator = new VoxelWorldGenerator(state.seed)

    const pixelRatio = window.devicePixelRatio
    const fov = 75;
    const near = 0.01;
    const far = 100000;
    let aspect = 2;  // the canvas default

    const canvas = state.canvas = document.querySelector('#c');
    const renderer = state.renderer = new WebGLRenderer({ canvas });
    renderer.setPixelRatio(pixelRatio);

    const camera = state.camera = new PerspectiveCamera(fov, aspect, near, far);
    const scene = state.scene = new Scene();
    const environment = new Environment({
        scene,
        camera,
        renderer
    })

    scene.add(environment)


    // CONTROLS
    let controls = state.controls = new VoxelMapControls(camera, renderer.domElement)
    controls.screenSpacePanning = false;
    controls.minDistance = 15;
    controls.maxDistance = 100;
    controls.maxPolarAngle = (Math.PI / 3);

    // MAP
    const map = state.map = new VoxelMap({
        camera
    })

    scene.add(map)

    // RENDER LOOP
    function render() {
        requestAnimationFrame(render);
        map.update()
        controls.update()
        renderer.render(scene, camera);

    }

    function updateRenderSize() {
        aspect = window.innerWidth / window.innerHeight;
        camera.aspect = aspect
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight)
    }

    window.addEventListener("resize", updateRenderSize);

    createGui({
        scene,
        camera,
        renderer
    })

    window.state = state

    updateRenderSize()
    requestAnimationFrame(render);



}


main();