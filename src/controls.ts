import { MapControls } from 'three/examples/jsm/controls/MapControls';

export class VoxelMapControls extends MapControls {
    constructor(camera, domElement) {
        super(camera, domElement)
        this.screenSpacePanning = false;
        this.minDistance = 20;
        this.maxDistance = 150;
        this.maxPolarAngle = (Math.PI / 2.5);
        this.maxPolarAngle = (Math.PI);
        this.enableDamping = false
        this.dampingFactor = 0.005
        this.panSpeed = 0.5

    }
}