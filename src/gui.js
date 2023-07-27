import { debounce } from 'lodash';
import { Pane } from 'tweakpane';


export function createGui({ scene, camera, renderer }) {
    const pane = new Pane();

    const updateProjectionMatrix = debounce(() => camera.updateProjectionMatrix(), 100)

    pane.addInput(camera, 'fov', {
        min: 30,
        max: 179,
    }).on('change', e => updateProjectionMatrix());
}