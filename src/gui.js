import { debounce } from 'lodash';
import { Pane } from 'tweakpane';


export function createGui({ scene, camera, renderer }) {
    const pane = new Pane();

    const updateProjectionMatrix = debounce(() => camera.updateProjectionMatrix(), 100)

    pane.addInput(camera, 'fov', {
        min: 15,
        max: 120,
    }).on('change', e => updateProjectionMatrix());
}