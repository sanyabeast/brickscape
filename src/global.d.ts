

interface Window {
    state: any; // replace 'any' with the type of your property
}

interface IAppState {
    seed: number,
    chunkSize: number,
    drawChunks: number,
    camera: any,
    scene: any,
    renderer: any,
    controls: any,
    map: any,
    perlin: any,
    seeded: any
}