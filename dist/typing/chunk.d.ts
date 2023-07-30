import { Group, InstancedMesh, InstancedBufferAttribute, Material, GridHelper } from "three";
import { Task } from "./tasker";
export declare class Chunk extends Group {
    static _chunksCounter: number;
    static _baseInstancedMesh: any;
    static _baseBlockMaterial: Material;
    cx: number;
    cz: number;
    serial: number;
    _buildTask: Task;
    _built: boolean;
    _instanceDataAttribute: InstancedBufferAttribute;
    _instanceVisibilityAttribute: InstancedBufferAttribute;
    _instancedMesh: InstancedMesh;
    _gridHelper: GridHelper;
    get bx0(): number;
    get bz0(): number;
    constructor({ cx, cz }: {
        cx: any;
        cz: any;
    });
    sync(): void;
    _updateGeometry(updateAttrs?: boolean): void;
    _computedInstanceIndex(x: any, y: any, z: any): number;
    kill(): void;
    setup(cx: number, cz: number): void;
    toString(): string;
    static computedInstanceIndex(bx0: any, bz0: any, x: any, y: any, z: any): number;
    static load(cx: number, cz: number): Chunk;
    static unload(chunk: Chunk): void;
    static _createInstancedMesh(): InstancedMesh;
}
