import { PerspectiveCamera, WebGLRenderer, Scene } from 'three';
import { BrickscapeHeroControls, BrickscapeEagleControls, getControlsOfType, EBrickscapeControlsType, setActiveControls } from './controls';
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
import { printd } from './utils';


async function main() {
    const renderer = state.renderer = new RenderingHelper({
        useComposer: false
    });

    let paused = false
    let prevFrameTime = performance.now();

    document.addEventListener('visibilitychange', () => {
        paused = document.visibilityState != 'visible'
        prevFrameTime = performance.now()
        printd(`paused: ${paused}`)
    })

    state.scene = new Scene();
    setActiveControls(EBrickscapeControlsType.Eagle)
    const environment = new Environment()
    const map = state.map = new MapManager()

    renderer.initialize()

    // RENDER LOOP
    
    function render() {
        requestAnimationFrame(render);

        if (!paused) {
            let now = performance.now();
            let timeDelta = (now - prevFrameTime) / 1000
            let frameDelta = (timeDelta / (1 / 60))
            state.frameDelta = frameDelta
            state.timeDelta = timeDelta
            prevFrameTime = now
            
            updateGlobalUniforms()
            environment.update()
            map.update()
            state.controls.update()
            renderer.render();
        }
    }

    createGui()

    tasker.start()
    requestAnimationFrame(render);

    // debug
    window.state = state
}


main();