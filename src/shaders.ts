import { Vector3, TextureLoader, MeshStandardMaterial, MeshLambertMaterial, Material, ShaderMaterial, Vector2, NearestFilter, LinearFilter, NearestMipMapLinearFilter, MeshToonMaterial, RepeatWrapping, MeshPhysicalMaterial } from "three";
import { FeatureLevel, featureLevel, state } from "./state";
import { blockManager } from "./blocks";

let _shaderTime = 0

// Texture loader for loading the tilemap texture
let _textureLoader = new TextureLoader()
let _tilesSF0 = _textureLoader.load('assets/tiles_sf0.png')
let _tilesSF1 = _textureLoader.load('assets/tiles_sf1.png')
let _tilesCF0 = _textureLoader.load('assets/tiles_cf0.png')
let _tilesCF1 = _textureLoader.load('assets/tiles_cf1.png')


_tilesSF0.flipY = _tilesSF1.flipY = false
_tilesCF0.flipY = _tilesCF1.flipY = false

_tilesSF1.minFilter = NearestFilter
_tilesSF0.minFilter = NearestFilter

_tilesSF1.magFilter = NearestFilter
_tilesSF0.magFilter = NearestFilter

_tilesCF1.minFilter = NearestFilter
_tilesCF0.minFilter = NearestFilter

_tilesCF1.magFilter = NearestFilter
_tilesCF0.magFilter = NearestFilter


export const _perlinNoiseTexture = _textureLoader.load('assets/noise/perlin.32_1.png')
_perlinNoiseTexture.wrapS = RepeatWrapping
_perlinNoiseTexture.wrapT = RepeatWrapping

/**
 * Patch the material with custom shaders and uniforms.
 * @param {ShaderMaterial} mat - The material to be patched.
 * @param {string[]} hooks - Array of strings representing hooks in the shader code.
 */
function _patchMaterial(mat, hooks: string[]) {

  // Define the custom uniforms
  mat.uniforms = {
    uLightDirection: { value: new Vector3(0, 10, 2).normalize() },
    uFar: { value: state.camera.far },
    uNear: { value: state.camera.near },
    uMaxInstances: { value: blockManager.maxBlocksPerChunk },
    uTilesSF0: { value: _tilesSF0 },
    uTilesSF1: { value: _tilesSF1 },
    uTilesCF0: { value: _tilesCF0 },
    uTilesCF1: { value: _tilesCF1 },
    uTileSize: { value: 1 / 16 },
    uTime: { value: 0 },
    uResolution: { value: new Vector2() },
    uFogHeight: { value: state.worldHeight * 0.666 },
    uWindSpeed: { value: 0.01 },
    uFogDisturbanceScale: { value: 150 }

  }

  // Assign the vertex shader and fragment shader through onBeforeCompile
  mat.onBeforeCompile = (shader) => {
    // Pass the custom uniforms to the shader
    shader.uniforms.uLightDirection = mat.uniforms.uLightDirection;
    shader.uniforms.uFar = mat.uniforms.uFar;
    shader.uniforms.uNear = mat.uniforms.uNear;
    shader.uniforms.uMaxInstances = mat.uniforms.uMaxInstances;
    shader.uniforms.uTilesSF0 = mat.uniforms.uTilesSF0;
    shader.uniforms.uTilesSF1 = mat.uniforms.uTilesSF1;
    shader.uniforms.uTilesCF0 = mat.uniforms.uTilesCF0;
    shader.uniforms.uTilesCF1 = mat.uniforms.uTilesCF1;

    shader.uniforms.uTileSize = mat.uniforms.uTileSize;
    shader.uniforms.uFogHeight = mat.uniforms.uFogHeight;
    shader.uniforms.uWindSpeed = mat.uniforms.uWindSpeed;
    shader.uniforms.uFogDisturbanceScale = mat.uniforms.uFogDisturbanceScale;

    shader.uniforms.uPerlin = {
      value: _perlinNoiseTexture
    };
    shader.uniforms.uTime = {
      get value() {
        return _shaderTime
      },
      get needsUpdate() {
        return true
      }
    }

    shader.uniforms.uPixelRatio = {
      get value() {
        return window.devicePixelRatio
        // return state.renderer.getPixelRatio()
      },
      get needsUpdate() {
        return true
      }
    }

    let _resVector = new Vector2(0, 0)
    shader.uniforms.uResolution = {
      get value() {
        _resVector.set(state.renderer.width, state.renderer.height)
        return _resVector
      },
      get needsUpdate() {
        return true
      }
    }

    console.log(shader.vertexShader)
    console.log(shader.fragmentShader)

    // Replace hooks in the vertex shader with custom code
    shader.vertexShader = shader.vertexShader.replace(hooks[0], `
        attribute vec3 instanceData;
        attribute vec3 instanceExtraData;

        varying vec2 vUv;
        varying vec3 vPosition;
        varying vec3 vWorldPosition;
        varying vec3 vInstanceData;
        varying vec3 vInstanceExtraData;
        varying float vFaceOrientation; 
      `)

    shader.vertexShader = shader.vertexShader.replace(hooks[1], `
        if (instanceExtraData.x < 0.5) {
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
        vInstanceExtraData = instanceExtraData;
        vWorldPosition = worldPosition.xyz;

        // Approximate face orientation based on vertex normals
        vec3 faceNormal = normalize(normal);
        float faceDotUp = abs(dot(faceNormal, vec3(0.0, 1.0, 0.0))); // Assuming up direction is (0, 1, 0)
        vFaceOrientation = step(0.707, faceDotUp); // 0.707 is cos(45 degrees), change the threshold as needed
      `)

    // Replace hooks in the fragment shader with custom code
    shader.fragmentShader = shader.fragmentShader.replace(hooks[3], `
        uniform vec3 uColor;
        uniform vec3 uLightDirection;
        uniform float uFar;
        uniform float uNear;
        uniform float uMaxInstances;

        uniform sampler2D uTilesSF0;
        uniform sampler2D uTilesSF1;
        uniform sampler2D uTilesCF0;
        uniform sampler2D uTilesCF1;

        uniform float uTileSize;
        uniform float uTime;
        uniform vec2 uResolution;
        uniform float uPixelRatio;
        uniform sampler2D uPerlin;
        uniform float uFogHeight;
        uniform float uWindSpeed;
        uniform float uFogDisturbanceScale;
        
        varying vec2 vUv;
        varying vec3 vPosition;
        varying vec3 vWorldPosition;
        varying vec3 vInstanceData;
        varying vec3 vInstanceExtraData;
        varying float vFaceOrientation; 
      `)

    shader.fragmentShader = shader.fragmentShader.replace(hooks[4], `
        if (vInstanceExtraData.x < 0.5){
          discard;
        }
      `)

    shader.fragmentShader = shader.fragmentShader.replace(hooks[5], `
        
        float animProgress = clamp((sin((uTime * vInstanceExtraData.y) * 32.) + 1.) / 2. - 1., 0., 1.);

        vec2 tileUV = vec2((vInstanceData.x + 1.) * uTileSize - (vUv.x * uTileSize), (vInstanceData.y + 1.) * uTileSize - (vUv.y * uTileSize));
        
        vec4 tColorSF0 = texture2D(uTilesSF0, tileUV);
        vec4 tColorSF1 = texture2D(uTilesSF1, tileUV);
        vec4 tColorCF0 = texture2D(uTilesCF0, tileUV);
        vec4 tColorCF1 = texture2D(uTilesCF1, tileUV);

        vec4 tColorS = mix(tColorSF0, tColorSF1, animProgress);
        vec4 tColorC = mix(tColorCF0, tColorCF1, animProgress);

        vec4 tColor = mix(tColorS, tColorC, vFaceOrientation);

        diffuseColor.rgb *= tColor.rgb;

        if ((fract(gl_FragCoord.y / 2.) + fract(gl_FragCoord.x / 2.)) / 2. > tColor.a){
          discard;
        }
      `)

    shader.fragmentShader = shader.fragmentShader.replace(hooks[6], `
        #include <aomap_fragment>
        reflectedLight.directDiffuse *= pow(vInstanceData.z, 2.);
        reflectedLight.indirectDiffuse *= pow(vInstanceData.z, 2.);
      `)

    shader.fragmentShader = shader.fragmentShader.replace('#include <emissivemap_fragment>', `
      #include <emissivemap_fragment>
      totalEmissiveRadiance.rgb = mix(
          vec3(0.), 
          diffuseColor.rgb, 
          clamp(vInstanceData.z - 1., 0., 1.)
      );

    `)

    shader.fragmentShader = shader.fragmentShader.replace('#include <fog_fragment>', `
      #ifdef USE_FOG
        #ifdef FOG_EXP2
          float fogFactor = 1.0 - exp( - fogDensity * fogDensity * vFogDepth * vFogDepth );
        #else
          float fogFactor = smoothstep( fogNear, fogFar, vFogDepth );
        #endif

        vec4 fogDisturbance0 = texture2D(uPerlin, ((1.-vWorldPosition.xy) / uFogDisturbanceScale) + (uTime * uWindSpeed));
        vec4 fogDisturbance1 = texture2D(uPerlin, ((1.-vWorldPosition.zy) / uFogDisturbanceScale) + (uTime * uWindSpeed));
        float fogDisturbance = mix(fogDisturbance0.r, fogDisturbance1.r, 0.5);

        fogFactor *= mix(0.3, 1., fogDisturbance);
        fogFactor *= mix(0.1, 1., 1.-clamp(vWorldPosition.y / uFogHeight, 0., 1.));

        gl_FragColor.rgb = mix( gl_FragColor.rgb, fogColor, fogFactor );

        // gl_FragColor.rgb = vec3(vFaceOrientation, 0., 0.);
      #endif
    `)

    // shader.fragmentShader = shader.fragmentShader.replace(hooks[7], `
    //     #include <transmission_fragment>
    //     totalDiffuse *= pow(vInstanceData.z, 1.);
    //     totalSpecular *= pow(vInstanceData.z, 1.);
    //   `)
  };
}

/**
 * Represents a custom material based on MeshStandardMaterial with voxel rendering capabilities.
 */
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

    // Patch the material with custom shaders and uniforms
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

export class VoxelBlockPhysicalMaterial extends MeshPhysicalMaterial {
  uniforms = null
  constructor() {
    super({
      // Define additional properties specific to your needs with MeshStandardMaterial
      roughness: 1,
      metalness: 0,
      envMapIntensity: 0.25,
      flatShading: true,
      specularIntensity: 1
    });

    // Patch the material with custom shaders and uniforms
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

/**
 * Represents a custom material based on MeshLambertMaterial with voxel rendering capabilities.
 */
export class VoxelBlockLamberMaterial extends MeshLambertMaterial {
  uniforms = null
  constructor() {
    super({
      flatShading: true
    });

    // Patch the material with custom shaders and uniforms
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

/**
 * Represents a custom material based on MeshLambertMaterial with voxel rendering capabilities.
 */
export class VoxelBlockPhongMaterial extends MeshLambertMaterial {
  uniforms = null
  constructor() {
    super({
      flatShading: true
    });

    // Patch the material with custom shaders and uniforms
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

export class VoxelBlockToonMaterial extends MeshToonMaterial {
  uniforms = null
  constructor() {
    super({

    });

    // Patch the material with custom shaders and uniforms
    _patchMaterial(this, [
      '#define TOON',
      '#include <uv_vertex>',
      '#include <fog_vertex>',
      '#define TOON',
      '#include <clipping_planes_fragment>',
      '#include <color_fragment>',
      '#include <aomap_fragment>',
      '#include <transmission_fragment>'
    ])
  }
}

/**
 * Get the base material for rendering voxel blocks based on the current feature level.
 * @returns {Material} - The base material.
 */
export function getBlockBaseMaterial(): Material {
  // Return either VoxelBlockLamberMaterial or VoxelBlockStandardMaterial based on the feature level
  return featureLevel === FeatureLevel.Low ? new VoxelBlockStandardMaterial() : new VoxelBlockStandardMaterial()
}

export function updateGlobalUniforms() {
  _shaderTime = _shaderTime + state.timeDelta
}