import { ShaderMaterial, Color, Vector3, TextureLoader, MeshStandardMaterial, MeshLambertMaterial, Material } from "three";
import { FeatureLevel, featureLevel, state } from "./state";
import { blockManager } from "./blocks";

let _textureLoader = new TextureLoader()
let _tilemap = _textureLoader.load('assets/tiles.png')
_tilemap.flipY = false

function _patchMaterial(mat, hooks: string[]) {

  mat.uniforms = {
    uLightDirection: { value: new Vector3(0, 10, 2).normalize() },
    uFar: { value: state.camera.far },
    uNear: { value: state.camera.near },
    uMaxInstances: { value: blockManager.maxBlocksPerChunk },
    uTiles: { value: _tilemap },
    uTileSize: { value: 1 / 16 },
  }

  // Assign the vertex shader and fragment shader through onBeforeCompile
  mat.onBeforeCompile = (shader) => {
    shader.uniforms.uLightDirection = mat.uniforms.uLightDirection;
    shader.uniforms.uFar = mat.uniforms.uFar;
    shader.uniforms.uNear = mat.uniforms.uNear;
    shader.uniforms.uMaxInstances = mat.uniforms.uMaxInstances;
    shader.uniforms.uTiles = mat.uniforms.uTiles;
    shader.uniforms.uTileSize = mat.uniforms.uTileSize;

    console.log(shader.vertexShader)
    console.log(shader.fragmentShader)

    shader.vertexShader = shader.vertexShader.replace(hooks[0], `
        attribute vec3 instanceData;
        attribute float instanceVisibility;

        varying vec2 vUv;
        varying vec3 vPosition;
        varying vec3 vWorldPosition;
        varying vec3 vInstanceData;
        varying float vInstanceVisibility;
      `)

    shader.vertexShader = shader.vertexShader.replace(hooks[1], `
        if (instanceVisibility < 0.5) {
          gl_Position = vec4(-99999., -99999., -99999., -1.);
          return;
        }
        #include <uv_vertex>
      `)

    shader.vertexShader = shader.vertexShader.replace(hooks[2], `
        #include <fog_vertex>
        vUv = uv;  // Transfer position to varying
        vPosition = position.xyz;
        vInstanceData = instanceData;
        vInstanceVisibility = instanceVisibility;

        // mvPosition = modelViewMatrix * instanceMatrix * vec4(position,1.0);
        // gl_Position = projectionMatrix * mvPosition;
      `)


    shader.fragmentShader = shader.fragmentShader.replace(hooks[3], `
        uniform vec3 uColor;
        uniform vec3 uLightDirection;
        uniform float uFar;
        uniform float uNear;
        uniform float uMaxInstances;
        uniform sampler2D uTiles;
        uniform float uTileSize;
        
        varying vec2 vUv;
        varying vec3 vPosition;
        varying vec3 vWorldPosition;
        varying vec3 vInstanceData;
        varying float vInstanceVisibility;

      `)

    shader.fragmentShader = shader.fragmentShader.replace(hooks[4], `
        if (vInstanceVisibility < 0.5){
          discard;
        }
      `)

    shader.fragmentShader = shader.fragmentShader.replace(hooks[5], `
        vec2 tileUV = vec2(vInstanceData.x * uTileSize + (vUv.x * uTileSize), vInstanceData.y * uTileSize + (vUv.y * uTileSize));
        vec4 tileColor = texture2D(uTiles, tileUV);

        // Use linear depth to fade objects in the distance
        diffuseColor.rgb *= tileColor.xyz;
        //diffuseColor.rgb *= vInstanceData.z;
      `)

    shader.fragmentShader = shader.fragmentShader.replace(hooks[6], `
        #include <aomap_fragment>
        reflectedLight.directDiffuse *= pow(vInstanceData.z, 2.);
        reflectedLight.indirectDiffuse *= pow(vInstanceData.z, 2.);
      `)

    shader.fragmentShader = shader.fragmentShader.replace(hooks[7], `
        #include <transmission_fragment>
        totalDiffuse *= pow(vInstanceData.z, 1.);
        totalSpecular *= pow(vInstanceData.z, 1.);
      `)

    // Ensure you define the varying variables here, which are used in both vertex and fragment shaders
    // e.g., shader.vertexShader = `varying vec2 vUv;` + shader.vertexShader;
    //       shader.fragmentShader = `varying vec2 vUv;` + shader.fragmentShader;
  };
}

export class VoxelBlockStandardMaterial extends MeshStandardMaterial {
  uniforms = null
  constructor() {
    super({
      // Define additional properties specific to your needs with MeshStandardMaterial
      roughness: 1,
      metalness: 0,
      envMapIntensity: 0.25,
      flatShading: true
    });

    _patchMaterial(this, [
      '#define STANDARD',
      '#include <uv_vertex>',
      '#include <fog_vertex>',
      '#define STANDARD',
      '#include <clipping_planes_fragment>',
      '#include <color_fragment>',
      '#include <aomap_fragment>',
      '#include <transmission_fragment>'
    ])
  }

}

export class VoxelBlockLamberMaterial extends MeshLambertMaterial {
  uniforms = null
  constructor() {
    super({
      flatShading: true
    });

    _patchMaterial(this, [
      '#define LAMBERT',
      '#include <uv_vertex>',
      '#include <fog_vertex>',
      '#define LAMBERT',
      '#include <clipping_planes_fragment>',
      '#include <color_fragment>',
      '#include <aomap_fragment>',
      '#include <transmission_fragment>'
    ])
  }
}

export class VoxelBlockPhongMaterial extends MeshLambertMaterial {
  uniforms = null
  constructor() {
    super({
      flatShading: true
    });

    _patchMaterial(this, [
      '#define LAMBERT',
      '#include <uv_vertex>',
      '#include <fog_vertex>',
      '#define LAMBERT',
      '#include <clipping_planes_fragment>',
      '#include <color_fragment>',
      '#include <aomap_fragment>',
      '#include <transmission_fragment>'
    ])
  }
}

export function getBlockBaseMaterial(): Material {
  return featureLevel === FeatureLevel.Low ? new VoxelBlockLamberMaterial() : new VoxelBlockStandardMaterial()
}