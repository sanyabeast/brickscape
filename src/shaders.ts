import { ShaderMaterial, Color, Vector3, TextureLoader, MeshStandardMaterial } from "three";

let _textureLoader = new TextureLoader()
let _tilemap = _textureLoader.load('assets/tiles.png')
_tilemap.flipY = false

export class VoxelBlockStandardMaterial extends MeshStandardMaterial {
  uniforms = null
  constructor({ color, maxInstances, state }) {
    super({
      // Define additional properties specific to your needs with MeshStandardMaterial
      roughness: 1,
      metalness: 0,
      envMapIntensity: 0.25,
      flatShading: true
    });

    // Set color and other properties that you want to inherit from MeshStandardMaterial
    this.color = new Color(color);

    this.uniforms = {
      uLightDirection: { value: new Vector3(0, 10, 2).normalize() },
      uFar: { value: state.camera.far },
      uNear: { value: state.camera.near },
      uMaxInstances: { value: maxInstances },
      uTiles: { value: _tilemap },
      uTileSize: { value: 1 / 16 },
    }

    // Assign the vertex shader and fragment shader through onBeforeCompile
    this.onBeforeCompile = (shader) => {
      shader.uniforms.uLightDirection = this.uniforms.uLightDirection;
      shader.uniforms.uFar = this.uniforms.uFar;
      shader.uniforms.uNear = this.uniforms.uNear;
      shader.uniforms.uMaxInstances = this.uniforms.uMaxInstances;
      shader.uniforms.uTiles = this.uniforms.uTiles;
      shader.uniforms.uTileSize = this.uniforms.uTileSize;

      console.log(shader.vertexShader)

      shader.vertexShader = shader.vertexShader.replace('#define STANDARD', `
        attribute vec3 instanceData;
        attribute float instanceVisibility;

        varying vec2 vUv;
        varying vec3 vPosition;
        varying vec3 vWorldPosition;
        varying vec3 vInstanceData;
        varying float vInstanceVisibility;
      `)

      shader.vertexShader = shader.vertexShader.replace('#include <fog_vertex>', `
        #include <fog_vertex>
        vUv = uv;  // Transfer position to varying
        vPosition = position.xyz;
        worldPosition = modelMatrix * instanceMatrix * vec4( position, 1.0 );
        vWorldPosition = worldPosition.xyz;
        vInstanceData = instanceData;
        vInstanceVisibility = instanceVisibility;

        mvPosition = modelViewMatrix * instanceMatrix * vec4(position,1.0);
        gl_Position = projectionMatrix * mvPosition;
      `)

      console.log(shader.fragmentShader)

      shader.fragmentShader = shader.fragmentShader.replace('#define STANDARD', `
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

      shader.fragmentShader = shader.fragmentShader.replace('#include <color_fragment>', `
        #include <color_fragment>
        if (vInstanceVisibility < 0.5){
          discard;
        }

        vec2 tileUV = vec2(vInstanceData.x * uTileSize + (vUv.x * uTileSize), vInstanceData.y * uTileSize + (vUv.y * uTileSize));
        vec4 tileColor = texture2D(uTiles, tileUV);

        // Use linear depth to fade objects in the distance
        diffuseColor.rgb *= tileColor.xyz;
        //diffuseColor.rgb *= vInstanceData.z;
      `)

      shader.fragmentShader = shader.fragmentShader.replace('#include <aomap_fragment>', `
        #include <aomap_fragment>
        reflectedLight.directDiffuse *= pow(vInstanceData.z, 2.);
        reflectedLight.indirectDiffuse *= pow(vInstanceData.z, 2.);
      `)

      shader.fragmentShader = shader.fragmentShader.replace('#include <transmission_fragment>', `
        #include <transmission_fragment>
        totalDiffuse *= pow(vInstanceData.z, 1.);
        totalSpecular *= pow(vInstanceData.z, 1.);
      `)

      // Ensure you define the varying variables here, which are used in both vertex and fragment shaders
      // e.g., shader.vertexShader = `varying vec2 vUv;` + shader.vertexShader;
      //       shader.fragmentShader = `varying vec2 vUv;` + shader.fragmentShader;
    };
  }

}