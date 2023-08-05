import { Camera, Plane, Raycaster, Vector2, Vector3 } from 'three';
import { MapControls } from 'three/examples/jsm/controls/MapControls';
import { PointerLockControls } from 'three/examples/jsm/controls/PointerLockControls.js';
import { state } from './state';
import { blockManager } from './blocks';
import { lerp } from './utils';
import { clamp } from 'lodash';

export enum EBrickscapeControlsType {
    Eagle,
    Hero
}

export interface IBrickscapeControls {
    getAnchorPosition(): Vector3
    update(frameTimeDelta: number)
}

export class BrickscapeEagleControls extends MapControls implements IBrickscapeControls {
    _groundPlane = new Plane(new Vector3(0, 1, 0), 0);
    _intersection = new Vector3();
    _raycaster = new Raycaster();

    constructor(camera, domElement) {
        super(camera, domElement)
        this.screenSpacePanning = false;
        this.minDistance = 20;
        this.maxDistance = 100;
        this.maxPolarAngle = (Math.PI / 2.5);
        this.maxPolarAngle = (Math.PI);
        this.enableDamping = false
        this.dampingFactor = 0.005
        this.panSpeed = 0.5
    }


    getAnchorPosition(): Vector3 {
        return this._getCameraLookIntersection(state.camera);
    }

    _getCameraLookIntersection(camera) {
        this._raycaster.setFromCamera(new Vector2(0, 0), camera);
        this._raycaster.ray.intersectPlane(this._groundPlane, this._intersection);
        return this._intersection;
    }
}

export class BrickscapeHeroControls extends PointerLockControls implements IBrickscapeControls {
    _moveForward: boolean = false
    _moveBackward: boolean = false
    _moveLeft: boolean = false
    _moveRight: boolean = false
    _canJump: boolean = false
    _onObject: boolean = false
    _velocity: Vector3
    _direction: Vector3
    _maxElevation = 0
    _heroHeight = 3
    _walkVelocity = 50
    _jumpImpulse = 20
    _jumpDeceleration = 10

    constructor(camera, domElement) {
        super(camera, domElement)

        this._velocity = new Vector3()
        this._direction = new Vector3()

        document.addEventListener('keydown', this._onKeyDown.bind(this));
        document.addEventListener('keyup', this._onKeyUp.bind(this));

        domElement.addEventListener('click', () => {
            this.lock();
        });
        this.addEventListener('lock', () => {
            console.log(`locked`)
        })
        this.addEventListener('unlock', () => {
            console.log(`unlocked`)
        })

        state.scene.add(this.getObject())
    }
    getAnchorPosition(): Vector3 {
        return state.camera.position;
    }
    _onKeyDown(event) {
        switch (event.code) {
            case 'ArrowUp':
            case 'KeyW':
                this._moveForward = true;
                break;

            case 'ArrowLeft':
            case 'KeyA':
                this._moveLeft = true;
                break;

            case 'ArrowDown':
            case 'KeyS':
                this._moveBackward = true;
                break;

            case 'ArrowRight':
            case 'KeyD':
                this._moveRight = true;
                break;

            case 'Space':
                if (this._canJump === true) {
                    this._velocity.y += this._jumpImpulse;
                }
                this._canJump = false;
                break;
        }
    }
    _onKeyUp(event) {
        switch (event.code) {
            case 'ArrowUp':
            case 'KeyW':
                this._moveForward = false;
                break;

            case 'ArrowLeft':
            case 'KeyA':
                this._moveLeft = false;
                break;

            case 'ArrowDown':
            case 'KeyS':
                this._moveBackward = false;
                break;

            case 'ArrowRight':
            case 'KeyD':
                this._moveRight = false;
                break;
        }

    }
    update() {
        let delta = state.timeDelta
        let object = this.getObject()
        let position = object.position
        let maxElevation = clamp(blockManager.getElevationAtUnder(position.x, position.y, position.z), 0, state.worldHeight)

        this._maxElevation = lerp(this._maxElevation, maxElevation, 0.1);

        this._velocity.x -= this._velocity.x * 10.0 * delta;
        this._velocity.z -= this._velocity.z * 10.0 * delta;

        this._velocity.y -= 9.8 * this._jumpDeceleration * delta; // 100.0 = mass

        this._direction.z = Number(this._moveForward) - Number(this._moveBackward);
        this._direction.x = Number(this._moveRight) - Number(this._moveLeft);
        this._direction.normalize(); // this ensures consistent this._movements in all this._directions

        this._velocity.z -= this._direction.z * this._walkVelocity * delta;
        this._velocity.x -= this._direction.x * this._walkVelocity * delta;

        if (this._onObject === true) {

            this._velocity.y = Math.max(0, this._velocity.y);
            this._canJump = true;

        }

        this.moveRight(- this._velocity.x * delta);
        this.moveForward(- this._velocity.z * delta);
        object.position.y += (this._velocity.y * delta); // new behavior

        if (object.position.y < this._maxElevation + this._heroHeight) {
            this._velocity.y = 0;
            object.position.y = this._maxElevation + this._heroHeight;
            this._canJump = true;
        }
    }
}

export function getControlsOfType(type: EBrickscapeControlsType) {
    switch (type) {
        case EBrickscapeControlsType.Eagle: {
            return new BrickscapeEagleControls(state.camera, state.renderer.canvas)
        }
        case EBrickscapeControlsType.Hero: {
            return new BrickscapeHeroControls(state.camera, state.renderer.canvas)
        }
    }
}