import { PerspectiveCamera, WebGLRenderer, Scene } from 'three';
import { VoxelMapControls } from './controls';
import { MapManager } from './map';
import { createGui } from './gui';
import { state } from './state'
import { Environment } from './environment';
import { VoxelWorldGenerator } from './generator';
import { Tasker } from './tasker';
import { WorldManager, worldManager } from './world';
import { BlockManager } from './blocks';


function main() {

    state.generator = new VoxelWorldGenerator(state.seed)
    state.tasker = new Tasker({ rate: 30 })
    state.world = WorldManager.getInstance()
    state.blockManager = BlockManager.getInstance()

    const pixelRatio = window.devicePixelRatio
    const fov = 89;
    const near = 0.1;
    const far = 2048;
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
    controls.minDistance = 20;
    controls.maxDistance = 50;
    controls.maxPolarAngle = (Math.PI / 2.5);
    controls.maxPolarAngle = (Math.PI);
    controls.enableDamping = true
    controls.dampingFactor = 0.01
    controls.panSpeed = 0.75

    // MAP
    const map = state.map = new MapManager({
        camera
    })

    scene.add(map)

    // RENDER LOOP
    let prevFrameTime = +new Date()
    function render() {
        let now = +new Date()
        let frameTimeDelta = now - prevFrameTime
        let frameDelta = frameTimeDelta / (1000 / 60)
        requestAnimationFrame(render);
        environment.update(frameDelta)
        map.update()
        controls.update()
        renderer.render(scene, camera);
        prevFrameTime = now

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

    state.tasker.start()
    updateRenderSize()
    requestAnimationFrame(render);



}


main();