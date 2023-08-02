import { Camera, Scene, WebGLRenderer, WebGLRendererParameters } from "three";
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { SAOPass } from 'three/examples/jsm/postprocessing/SAOPass.js';
import { SSAOPass } from 'three/examples/jsm/postprocessing/SSAOPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
import { FeatureLevel, featureLevel, state } from "./state";
import { printd } from "./utils";

const _pixelRatio = window.devicePixelRatio

export interface IBrickscapeRendererParams extends WebGLRendererParameters {
    useComposer: boolean
}

export class RenderingHelper {
    _composer: EffectComposer
    _renderer: WebGLRenderer
    useComposer: boolean = false
    canvas: HTMLCanvasElement

    get width() {
        return this.canvas.width
    }

    get height() {
        return this.canvas.height
    }


    constructor(params: IBrickscapeRendererParams) {
        const canvas = this.canvas = document.createElement('canvas');
        document.body.appendChild(canvas)

        this._renderer = new WebGLRenderer({
            canvas,
            antialias: featureLevel != FeatureLevel.Low
        });


        this._renderer.setPixelRatio(featureLevel == FeatureLevel.Low ? 1 : _pixelRatio);

        let scene = state.scene
        let camera = state.camera

        if (params.useComposer) {
            this.useComposer = true

            let composer = this._composer = new EffectComposer(this._renderer);
            let renderPass = new RenderPass(scene, camera);

            const ssaoPass = new SSAOPass(scene, camera, window.innerWidth, window.innerHeight);
            ssaoPass.kernelRadius = 100;
            composer.addPass(ssaoPass);

            console.log(ssaoPass)

            const outputPass = new OutputPass();
            composer.addPass(outputPass);

        }
        this._updateRenderSize()
        window.addEventListener("resize", this._updateRenderSize.bind(this));
    }

    render() {
        if (this.useComposer) {
            this._composer.render()
        } else {
            this._renderer.render(state.scene, state.camera)
        }
    }

    _updateRenderSize() {
        let aspect = window.innerWidth / window.innerHeight;
        state.camera.aspect = aspect
        state.camera.updateProjectionMatrix();

        this._renderer.setSize(window.innerWidth, window.innerHeight)
        if (this.useComposer) {
            this._composer.setSize(window.innerWidth, window.innerHeight);
        }

    }

}