export declare class WorldManager {
    static instance: WorldManager;
    static getInstance(): WorldManager;
    get needsUpdate(): boolean;
    _chunksGeneratedStatus: {
        [x: string]: boolean;
    };
    updatedChunks: number[][];
    constructor();
    checkChunkGeneration(cx: number, cz: number): boolean;
    cancel(): void;
    _generateChunk(cx: number, cz: number): void;
    _updateChunkLighting(cx: number, cz: number): void;
}
export declare const worldManager: WorldManager;
