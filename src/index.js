import * as THREE from 'three';
import { HexMapControls } from './controls';

function main() {
    const pixelRatio = window.devicePixelRatio
    const fov = 75;
    const near = 0.01;
    const far = 1000;
    let aspect = 2;  // the canvas default

    const canvas = document.querySelector('#c');
    const renderer = new THREE.WebGLRenderer({ canvas });
    renderer.setPixelRatio(pixelRatio);

    const camera = window.camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
    // camera.position.set(-1, -1, -1);

    const scene = new THREE.Scene();

    const boxWidth = 1;
    const boxHeight = 1;
    const boxDepth = 1;
    const geometry = new THREE.BoxGeometry(boxWidth, boxHeight, boxDepth);

    const material = new THREE.MeshBasicMaterial({ color: 0x44aa88 });

    const cube = new THREE.Mesh(geometry, material);
    scene.add(cube);

    // GRID HELPER
    scene.add(new THREE.GridHelper(5, 10, 0x888888, 0x444444))

    // CONTROLS
    let controls = window.controls = new HexMapControls(camera, renderer.domElement)
    controls.screenSpacePanning = false;
    controls.minDistance = 10;
    controls.maxDistance = 500;
    controls.maxPolarAngle = Math.PI / 2;

    // RENDER LOOP
    function render(time) {
        requestAnimationFrame(render);

        time *= 0.001;  // convert time to seconds

        cube.rotation.x = time;
        cube.rotation.y = time;

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

    updateRenderSize()
    requestAnimationFrame(render);
}


main();