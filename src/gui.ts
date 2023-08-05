import { debounce } from 'lodash';
import { Pane } from 'tweakpane';
import { EBrickscapeControlsType, setActiveControls } from './controls';

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

export function createGui() {
    const controlPane = new Pane();
    const controlsFolder = controlPane.addFolder({
        title: 'Controls',
        expanded: true
    })

    controlsFolder.addButton({
        title: 'Eagle View',
        label: ""
    }).on('click', ()=>{
        setActiveControls(EBrickscapeControlsType.Eagle)
    })

    controlsFolder.addButton({
        title: 'Hero View',
        label: "(in test)"
    }).on('click', ()=>{
        setActiveControls(EBrickscapeControlsType.Hero)
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

    for (let k in monitoringData) {
        monitorFolder.addMonitor(monitoringData, k);
    }
}