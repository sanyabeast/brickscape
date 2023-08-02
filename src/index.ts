import { PerspectiveCamera, WebGLRenderer, Scene } from 'three';
import { VoxelMapControls } from './controls';
import { MapManager } from './map';
import { createGui } from './gui';
import { FeatureLevel, featureLevel, state } from './state'
import { Environment } from './environment';
import { GenerationHelper, generationHelper } from './generator';
import { tasker } from './tasker';
import { worldManager } from './world';
import { blockManager } from './blocks';
import { updateGlobalUniforms } from './shaders';
import { RenderingHelper } from './renderer';


async function main() {

    state.generator = generationHelper
    state.tasker = tasker
    state.world = worldManager
    state.blockManager = blockManager

    
    const fov = 60;
    const near = 0.1;
    const far = 2048;
    let aspect = 2;  // the canvas default

    const camera = state.camera = new PerspectiveCamera(fov, aspect, near, far);
    const scene = state.scene = new Scene();

    const renderer = state.renderer = new RenderingHelper({
        useComposer: false
    });


    const environment = new Environment({
        scene,
        camera,
        renderer
    })

    scene.add(environment)
    // CONTROLS
    let controls = state.controls = new VoxelMapControls(camera, renderer.canvas)
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

        updateGlobalUniforms(frameDelta)
        environment.update(frameDelta)
        map.update()
        controls.update()
        renderer.render();
        prevFrameTime = now

    }

    createGui({
        scene,
        camera,
        renderer
    })

    window.state = state
    state.tasker.start()

    requestAnimationFrame(render);
}


main();