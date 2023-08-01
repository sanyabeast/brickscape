import { debounce } from 'lodash';
import { Pane } from 'tweakpane';

const appInfo = `
## DESCRIPTION
Voxel World Procedural Generation: 
A Three.js demo with 
custom shaders 
and instanced geometry. 
Explore dynamically 
generated landscapes 
and structures using 
different rules 
and seeded noises. 
Open-source on GitHub

## Author
@sanyabeast
`;

export const monitoringData: { [x: string]: string } = {
    activeChunk: '',
    totalTasks: '',
    chunksPoolSize: ''
}

export function createGui({ scene, camera, renderer }) {
    const controlPane = new Pane();
    const controlsFolder = controlPane.addFolder({
        title: 'Controls',
        expanded: false
    })

    const monitorFolder = controlPane.addFolder({
        title: 'Monitoring',
        expanded: false
    })

    const infoFolder = controlPane.addFolder({
        title: 'Info',
        expanded: false
    })

    infoFolder.addMonitor({ description: appInfo }, 'description', {
        multiline: true,
        lineCount: 16,
    });

    const updateProjectionMatrix = debounce(() => camera.updateProjectionMatrix(), 100)

    controlsFolder.addInput(camera, 'fov', {
        min: 30,
        max: 179,
    }).on('change', e => updateProjectionMatrix());

    for (let k in monitoringData) {
        monitorFolder.addMonitor(monitoringData, k);
    }
}