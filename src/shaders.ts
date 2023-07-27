import { ShaderMaterial, Color, Vector3 } from "three";
import { maxBlocksInChunk, state } from "./state";

export class VoxelBlockMaterial extends ShaderMaterial {
  constructor({ color }) {
    super({
      // Uniforms
      uniforms: {
        uColor: { value: new Color(color) }, // Pass color as a uniform
        uLightDirection: { value: new Vector3(0, 10, 2).normalize() },
        uFar: { value: state.camera.far }, // Far plane
        uNear: { value: state.camera.near }, // Near plane
        uMaxInstances: {value: maxBlocksInChunk}
      },
      // Vertex shader
      vertexShader: `
              attribute vec4 instanceIndex;

              varying vec2 vUv;
              varying vec3 vNormal;
              varying vec3 vPosition;
              varying vec3 vWorldPosition;
              varying vec4 vInstanceIndex;

              void main() {
                vUv = uv;  // Transfer position to varying
                vNormal = normalize(normalMatrix * normal);
                vPosition = position.xyz;
                vec4 worldPosition = modelMatrix * instanceMatrix * vec4( position, 1.0 );
                vWorldPosition = worldPosition.xyz;
                vInstanceIndex = instanceIndex;

                vec4 mvPosition = modelViewMatrix * instanceMatrix * vec4(position,1.0);
                gl_Position = projectionMatrix * mvPosition;
              }
            `,
      // Fragment shader
      fragmentShader: `
              uniform vec3 uColor;
              uniform vec3 uLightDirection;
              uniform float uFar;
              uniform float uNear;
              uniform float uMaxInstances;
              
              varying vec3 vNormal;
              varying vec3 vPosition;
              varying vec3 vWorldPosition;
              varying vec4 vInstanceIndex;

              void main() {
                // Basic Lambertian shading
                float brightness = clamp(max(dot(vNormal, uLightDirection), 0.0), 0.25, 1.);
                vec3 litColor = brightness * uColor;
          
                // Compute depth
                float depth = gl_FragCoord.z;
                float linearDepth = (2.0 * uNear) / (uFar + uNear - depth * (uFar - uNear));
          
                float height = vWorldPosition.y;
                float heightFactor = clamp((height / 8.),0.25, 1.);

                // Use linear depth to fade objects in the distance
                gl_FragColor = vec4(litColor* (vInstanceIndex.z), 1.0);
              }
            `,
    })
  }
  set color(v) {
    this.uniforms.uColor.value.setHex(v)
  }
  get color() {
    return this.uniforms.uColor.value;
  }
}