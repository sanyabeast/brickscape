import { PerspectiveCamera, Plane, Raycaster, Vector3 } from 'three';
import { MapControls } from 'three/examples/jsm/controls/MapControls';
import { PointerLockControls } from 'three/examples/jsm/controls/PointerLockControls.js';
export declare enum EBrickscapeControlsType {
    Eagle = 0,
    Hero = 1
}
export interface IBrickscapeControls {
    infoWidget: string;
    getAnchorPosition(): Vector3;
    setAnchorPosition(pos: Vector3): void;
    update(): any;
    camera: PerspectiveCamera;
    setAspectRatio(value: number): any;
    enabled: boolean;
}
export declare class BrickscapeEagleControls extends MapControls implements IBrickscapeControls {
    static instance?: IBrickscapeControls;
    static getInstance(): IBrickscapeControls;
    constructor();
    camera: PerspectiveCamera;
    enabled: boolean;
    _groundPlane: Plane;
    _intersection: Vector3;
    _raycaster: Raycaster;
    _nearClip: number;
    _farClip: number;
    infoWidget: string;
    setAspectRatio(value: number): void;
    getAnchorPosition(): Vector3;
    setAnchorPosition(pos: Vector3): void;
    _getCameraLookIntersection(camera: any): Vector3;
}
export declare class BrickscapeHeroControls extends PointerLockControls implements IBrickscapeControls {
    static instance?: IBrickscapeControls;
    static getInstance(): IBrickscapeControls;
    constructor();
    infoWidget: string;
    _moveForward: boolean;
    _moveBackward: boolean;
    _moveLeft: boolean;
    _moveRight: boolean;
    _canJump: boolean;
    _onObject: boolean;
    _velocity: Vector3;
    _direction: Vector3;
    _heroHeight: number;
    _eyesElevation: number;
    _walkVelocity: number;
    _runVelocity: number;
    _walkFov: number;
    _runFov: number;
    _jumpImpulse: number;
    _fallingVelocity: number;
    _isRunning: boolean;
    _currentFov: number;
    _currentMovementVelocity: number;
    enabled: boolean;
    camera: PerspectiveCamera;
    _bodyBlocksTangibility: number[];
    reset(): void;
    setAspectRatio(value: number): void;
    getAnchorPosition(): Vector3;
    setAnchorPosition(pos: Vector3): void;
    _onKeyDown(event: any): void;
    _jump(): void;
    _onKeyUp(event: any): void;
    _updateLocalBlocksData(): void;
    get _footBlocksTangibility(): number;
    get _footBlocksTangibilityWeighted(): number;
    get _bubbleForce(): number;
    get _aboveHeadBlockTangibility(): number;
    update(): void;
}
export declare function getControlsOfType(type: EBrickscapeControlsType): IBrickscapeControls;
export declare function setActiveControls(type: EBrickscapeControlsType): void;
