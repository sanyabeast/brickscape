import { Camera, PerspectiveCamera, Plane, Raycaster, Vector2, Vector3 } from 'three';
import { MapControls } from 'three/examples/jsm/controls/MapControls';
import { PointerLockControls } from 'three/examples/jsm/controls/PointerLockControls.js';
import { state } from './state';
import { blockManager } from './blocks';
import { lerp, printd, slide } from './utils';
import { clamp, throttle } from 'lodash';

export enum EBrickscapeControlsType {
    Eagle,
    Hero
}

export interface IBrickscapeControls {
    infoWidget: string
    getAnchorPosition(): Vector3
    setAnchorPosition(pos: Vector3): void
    update()
    camera: PerspectiveCamera
    setAspectRatio(value: number)
    enabled: boolean
}

export class BrickscapeEagleControls extends MapControls implements IBrickscapeControls {
    static instance?: IBrickscapeControls
    static getInstance(): IBrickscapeControls {
        BrickscapeEagleControls.instance = BrickscapeEagleControls.instance ?? new BrickscapeEagleControls();
        return BrickscapeEagleControls.instance;
    }

    constructor() {
        let camera = new PerspectiveCamera(80, 1, 0.1, 1000)
        super(camera, state.renderer.canvas)

        this.camera = camera
        this.screenSpacePanning = false;
        this.minDistance = 20;
        this.maxDistance = 100;
        this.maxPolarAngle = (Math.PI / 2.5);
        // this.maxPolarAngle = (Math.PI);
        this.enableDamping = false
        this.dampingFactor = 0.005
        this.panSpeed = 0.5

        this.enabled = false
    }

    camera: PerspectiveCamera;
    override enabled: boolean = false
    _groundPlane = new Plane(new Vector3(0, 1, 0), 0);
    _intersection = new Vector3();
    _raycaster = new Raycaster();
    _nearClip = 0.1
    _farClip = 1000
    infoWidget: string = "eagle";

    setAspectRatio(value: number) {
        this.camera.aspect = value
        this.camera.updateProjectionMatrix()
    }

    getAnchorPosition(): Vector3 {
        return this._getCameraLookIntersection(this.camera);
    }
    setAnchorPosition(pos: Vector3): void {
        this.target.copy(pos)
        this.object.position.set(pos.x, state.worldHeight, pos.z - state.worldHeight)
        this.object.position.y = state.worldHeight
        console.log(this)
        // throw new Error('Method not implemented.');
    }

    _getCameraLookIntersection(camera) {
        this._raycaster.setFromCamera(new Vector2(0, 0), camera);
        this._raycaster.ray.intersectPlane(this._groundPlane, this._intersection);
        return this._intersection;
    }
}

export class BrickscapeHeroControls extends PointerLockControls implements IBrickscapeControls {
    static instance?: IBrickscapeControls
    static getInstance(): IBrickscapeControls {
        BrickscapeHeroControls.instance = BrickscapeHeroControls.instance ?? new BrickscapeHeroControls();
        return BrickscapeHeroControls.instance;
    }



    constructor() {
        let camera = new PerspectiveCamera(60, 1, 0.001, 1000)

        super(camera, state.renderer.canvas)

        this._bodyBlocksTangibility = [0, 0, 0, 0, 0]
        this._velocity = new Vector3()
        this._direction = new Vector3()

        document.addEventListener('keydown', this._onKeyDown.bind(this));
        document.addEventListener('keyup', this._onKeyUp.bind(this));

        state.renderer.canvas.addEventListener('click', () => {
            if (this.enabled) {
                this.lock();
            }
        });
        this.addEventListener('lock', () => {
            console.log(`locked`)
        })
        this.addEventListener('unlock', () => {
            console.log(`unlocked`)
        })

        this._jump = throttle(this._jump.bind(this), 1000 / 5, { leading: true })
        state.scene.add(this.getObject())
    }

    infoWidget: string = "hero";
    _moveForward: boolean = false
    _moveBackward: boolean = false
    _moveLeft: boolean = false
    _moveRight: boolean = false
    _canJump: boolean = false
    _onObject: boolean = false
    _velocity: Vector3
    _direction: Vector3
    _heroHeight: number = 2
    _eyesElevation: number = 2
    _walkVelocity: number = 30
    _runVelocity: number = 60
    _walkFov = 72
    _runFov = 90

    _jumpImpulse: number = 16
    _fallingVelocity: number = 6
    _isRunning: boolean

    _currentFov = 80
    _currentMovementVelocity = 0

    enabled: boolean = false
    override camera: PerspectiveCamera

    _bodyBlocksTangibility: number[]

    reset() {
        this.camera.position.y = state.worldHeight;
    }
    setAspectRatio(value: number) {
        this.camera.aspect = value
        this.camera.updateProjectionMatrix()
    }
    getAnchorPosition(): Vector3 {
        return this.camera.position;
    }
    setAnchorPosition(pos: Vector3): void {
        this.camera.position.copy(pos)
        this.camera.position.y = state.worldHeight
    }
    _onKeyDown(event) {
        if (this.enabled) {
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
                    this._jump()
                    break;
                case 'ShiftLeft':
                case 'AltLeft':
                case 'ControlLeft':
                case 'ShiftRight':
                case 'AltRight':
                case 'ControlRight':
                    this._isRunning = true
                    break;
            }
        }
    }
    _jump() {
        if (this._canJump === true) {
            this._velocity.y += lerp(0, this._jumpImpulse, Math.pow(this._footBlocksTangibilityWeighted, 2));
        }
    }
    _onKeyUp(event) {
        if (this.enabled) {
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
                case 'ShiftLeft':
                case 'AltLeft':
                case 'ControlLeft':
                case 'ShiftRight':
                case 'AltRight':
                case 'ControlRight':
                    this._isRunning = false
                    break;
            }
        }
    }
    _updateLocalBlocksData() {
        let position = this.camera.position
        this._bodyBlocksTangibility = [
            blockManager.getTangibilityAtPosition(position.x + 0.5, position.y - 2, position.z + 0.5),
            blockManager.getTangibilityAtPosition(position.x + 0.5, position.y - 1, position.z + 0.5),
            blockManager.getTangibilityAtPosition(position.x + 0.5, position.y + 0, position.z + 0.5),
            blockManager.getTangibilityAtPosition(position.x + 0.5, position.y + 1, position.z + 0.5),
        ]

    }
    get _footBlocksTangibility(): number {
        return this._bodyBlocksTangibility[0]
    }
    get _footBlocksTangibilityWeighted(): number {
        let w =
            this._bodyBlocksTangibility[0] * 1 -
            this._bodyBlocksTangibility[1] * 0.5
        return clamp(w, 0, 1)
    }
    get _bubbleForce(): number {
        return clamp(Math.pow((this._bodyBlocksTangibility[0] +
            this._bodyBlocksTangibility[1] * 2) * 4, 4), 0, state.worldHeight * 2)
    }
    get _aboveHeadBlockTangibility(): number {
        return this._bodyBlocksTangibility[3]
    }
    update() {

        if (this.enabled) {
            this._updateLocalBlocksData()
            let delta = state.timeDelta
            let object = this.getObject()
            let position = object.position

            let targetWalkVelocity = this._isRunning ? this._runVelocity : this._walkVelocity
            // console.log(currentTangibility)
            let targetFallVelocity = lerp(this._fallingVelocity, 0, Math.pow(this._footBlocksTangibilityWeighted, 0.1))
            // let targetFallVelocity = lerp(this._fallingVelocity, 0, Math.pow(this._footBlocksTangibilityWeighted, 0.1))

            // console.log(this._footBlocksTangibilityWeighted)

            this._currentMovementVelocity = slide(this._currentMovementVelocity, targetWalkVelocity, 100 * delta);

            this._velocity.x -= this._velocity.x * 10.0 * delta;
            this._velocity.z -= this._velocity.z * 10.0 * delta;

            // console.log(this._bubbleForce, this._currentMovementVelocity, targetFallVelocity, targetWalkVelocity)

            if (this._bubbleForce > 0) {
                this._velocity.y += 9.8 * targetFallVelocity * delta * this._bubbleForce; // 100.0 = mass
                this._velocity.y = clamp(this._velocity.y, 0, this._velocity.y)
            } else {
                this._velocity.y -= 9.8 * targetFallVelocity * delta * (1 - this._bubbleForce); // 100.0 = mass
                this._velocity.y = clamp(this._velocity.y, this._velocity.y, 0)
            }

            if (isNaN(this._velocity.y)) {
                debugger
            }

            this._direction.z = Number(this._moveForward) - Number(this._moveBackward);
            this._direction.x = Number(this._moveRight) - Number(this._moveLeft);
            this._direction.normalize(); // this ensures consistent this._movements in all this._directions

            this._velocity.z -= this._direction.z * this._currentMovementVelocity * delta;
            this._velocity.x -= this._direction.x * this._currentMovementVelocity * delta;

            this.moveRight(- this._velocity.x * delta);
            this.moveForward(- this._velocity.z * delta);
            object.position.y += (this._velocity.y * delta); // new behavior

            this._canJump = this._footBlocksTangibilityWeighted > 0

            // z-reset
            if (object.position.y < 0 + this._heroHeight) {
                this._velocity.y = 0;
                object.position.y = 0 + 2;
                this._canJump = true;
            }


            /* fov */
            let targetFov = lerp(this._walkFov, this._runFov, clamp(this._currentMovementVelocity / this._runVelocity, 0, 1))
            this._currentFov = slide(this._currentFov, targetFov, 1)
            this.camera.fov = this._currentFov
            this.camera.updateProjectionMatrix()

        } else {
            this.unlock()
        }
    }
}

export function getControlsOfType(type: EBrickscapeControlsType) {
    switch (type) {
        case EBrickscapeControlsType.Eagle: {
            return BrickscapeEagleControls.getInstance()
        }
        case EBrickscapeControlsType.Hero: {
            return BrickscapeHeroControls.getInstance()
        }
    }
}

export function setActiveControls(type: EBrickscapeControlsType): void {
    let prevAnchorPosition: Vector3 = new Vector3(0, 0, 0)
    if (state.controls) {
        prevAnchorPosition = state.controls.getAnchorPosition()
        state.controls.enabled = false
        state.controls.update()
    }

    printd(`setActiveControls: ${type}`)

    let controls = state.controls = getControlsOfType(type)
    controls.setAnchorPosition(prevAnchorPosition)
    state.renderer.reset()

    document.querySelectorAll('.help-box').forEach((el: HTMLElement) => { el.style.visibility = "hidden"; });
    (document.querySelector(`.help-box.${controls.infoWidget}`) as HTMLElement).style.visibility = 'visible';

    state.controls.enabled = true
}