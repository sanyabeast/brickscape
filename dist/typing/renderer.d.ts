import { WebGLRenderer, WebGLRendererParameters } from "three";
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
export interface IBrickscapeRendererParams extends WebGLRendererParameters {
    useComposer: boolean;
}
export declare class RenderingHelper {
    _composer: EffectComposer;
    _renderer: WebGLRenderer;
    useComposer: boolean;
    canvas: HTMLCanvasElement;
    get width(): number;
    get height(): number;
    constructor(params: IBrickscapeRendererParams);
    initialize(): void;
    render(): void;
    reset(): void;
    _updateRenderSize(): void;
}
