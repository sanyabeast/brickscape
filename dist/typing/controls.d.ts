import { PerspectiveCamera, Plane, Raycaster, Vector3 } from 'three';
import { MapControls } from 'three/examples/jsm/controls/MapControls';
import { PointerLockControls } from 'three/examples/jsm/controls/PointerLockControls.js';
export declare enum EBrickscapeControlsType {
    Eagle = 0,
    Hero = 1
}
export interface IBrickscapeControls {
    getAnchorPosition(): Vector3;
    update(): any;
    camera: PerspectiveCamera;
    setAspectRatio(value: number): any;
    enabled: boolean;
    reset(): any;
}
export declare class BrickscapeEagleControls extends MapControls implements IBrickscapeControls {
    static instance?: IBrickscapeControls;
    static getInstance(): IBrickscapeControls;
    camera: PerspectiveCamera;
    enabled: boolean;
    _groundPlane: Plane;
    _intersection: Vector3;
    _raycaster: Raycaster;
    _nearClip: number;
    _farClip: number;
    constructor();
    setAspectRatio(value: number): void;
    getAnchorPosition(): Vector3;
    _getCameraLookIntersection(camera: any): Vector3;
}
export declare class BrickscapeHeroControls extends PointerLockControls implements IBrickscapeControls {
    static instance?: IBrickscapeControls;
    static getInstance(): IBrickscapeControls;
    _moveForward: boolean;
    _moveBackward: boolean;
    _moveLeft: boolean;
    _moveRight: boolean;
    _canJump: boolean;
    _onObject: boolean;
    _velocity: Vector3;
    _direction: Vector3;
    _maxElevation: number;
    _heroHeight: number;
    _walkVelocity: number;
    _runVelocity: number;
    _walkFov: number;
    _runFov: number;
    _jumpImpulse: number;
    _fallingVelocity: number;
    _isRunning: boolean;
    _currentFov: number;
    _currentMovementVelocity: number;
    _currentTangibility: number;
    enabled: boolean;
    camera: PerspectiveCamera;
    constructor();
    reset(): void;
    setAspectRatio(value: number): void;
    getAnchorPosition(): Vector3;
    _onKeyDown(event: any): void;
    _jump(): void;
    _onKeyUp(event: any): void;
    update(): void;
}
export declare function getControlsOfType(type: EBrickscapeControlsType): IBrickscapeControls;
export declare function setActiveControls(type: EBrickscapeControlsType): IBrickscapeControls;
