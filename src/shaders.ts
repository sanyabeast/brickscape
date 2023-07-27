import { ShaderMaterial, Color, Vector3 } from "three";
import { state } from "./state";

export class VoxelBlockMaterial extends ShaderMaterial {
  constructor({ color }) {
    super({
      // Uniforms
      uniforms: {
        uColor: { value: new Color(color) }, // Pass color as a uniform
        uLightDirection: { value: new Vector3(0, 10, 2).normalize() },
        uFar: { value: state.camera.far }, // Far plane
        uNear: { value: state.camera.near } // Near plane
      },
      // Vertex shader
      vertexShader: `
              varying vec3 vUv;
              varying vec3 vNormal;
              varying vec3 vPosition;
          
              void main() {
                vUv = position;  // Transfer position to varying
                vNormal = normalize(normalMatrix * normal);
                vPosition = position.xyz;

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
              
              varying vec3 vNormal;

              void main() {
                // Basic Lambertian shading
                float brightness = max(dot(vNormal, uLightDirection), 0.0);
                vec3 litColor = brightness * uColor;
          
                // Compute depth
                float depth = gl_FragCoord.z;
                float linearDepth = (2.0 * uNear) / (uFar + uNear - depth * (uFar - uNear));
          
                // Use linear depth to fade objects in the distance
                float fadeFactor = 1.0 + linearDepth;
          
                gl_FragColor = vec4(litColor * fadeFactor, 1.0);
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