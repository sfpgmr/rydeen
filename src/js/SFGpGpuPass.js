/**
 * @author SFPGMR
 */
 // Shader Sampleより拝借
 // https://github.com/mrdoob/three.js/blob/master/examples/webgl_shader.html
"use strict";
import GPUComputationRenderer  from './GPUComputationRenderer';

const fragmentShaderPosition = `
uniform float time;
uniform float delta;
void main()	{
  vec2 uv = gl_FragCoord.xy / resolution.xy;
  vec4 tmpPos = texture2D( texturePosition, uv );
  vec3 position = tmpPos.xyz;
  vec3 velocity = texture2D( textureVelocity, uv ).xyz;
  float phase = tmpPos.w;
  phase = mod( ( phase + delta +
    length( velocity.xz ) * delta * 3. +
    max( velocity.y, 0.0 ) * delta * 6. ), 62.83 );
  gl_FragColor = vec4( position + velocity * delta * 15. , phase );
}
`;

const fragmentShaderVelocity = `
uniform float time;
uniform float testing;
uniform float delta; // about 0.016
uniform float seperationDistance; // 20
uniform float alignmentDistance; // 40
uniform float cohesionDistance; //
uniform float freedomFactor;
uniform vec3 predator;
const float width = resolution.x;
const float height = resolution.y;
const float PI = 3.141592653589793;
const float PI_2 = PI * 2.0;
// const float VISION = PI * 0.55;
float zoneRadius = 40.0;
float zoneRadiusSquared = 1600.0;
float separationThresh = 0.45;
float alignmentThresh = 0.65;
const float UPPER_BOUNDS = BOUNDS;
const float LOWER_BOUNDS = -UPPER_BOUNDS;
const float SPEED_LIMIT = 9.0;
float rand(vec2 co){
  return fract(sin(dot(co.xy ,vec2(12.9898,78.233))) * 43758.5453);
}
void main() {
  zoneRadius = seperationDistance + alignmentDistance + cohesionDistance;
  separationThresh = seperationDistance / zoneRadius;
  alignmentThresh = ( seperationDistance + alignmentDistance ) / zoneRadius;
  zoneRadiusSquared = zoneRadius * zoneRadius;
  vec2 uv = gl_FragCoord.xy / resolution.xy;
  vec3 birdPosition, birdVelocity;
  vec3 selfPosition = texture2D( texturePosition, uv ).xyz;
  vec3 selfVelocity = texture2D( textureVelocity, uv ).xyz;
  float dist;
  vec3 dir; // direction
  float distSquared;
  float seperationSquared = seperationDistance * seperationDistance;
  float cohesionSquared = cohesionDistance * cohesionDistance;
  float f;
  float percent;
  vec3 velocity = selfVelocity;
  float limit = SPEED_LIMIT;
  dir = predator * UPPER_BOUNDS - selfPosition;
  dir.z = 0.;
  // dir.z *= 0.6;
  dist = length( dir );
  distSquared = dist * dist;
  float preyRadius = 150.0;
  float preyRadiusSq = preyRadius * preyRadius;
  // move birds away from predator
  if (dist < preyRadius) {
    f = ( distSquared / preyRadiusSq - 1.0 ) * delta * 100.;
    velocity += normalize( dir ) * f;
    limit += 5.0;
  }
  // if (testing == 0.0) {}
  // if ( rand( uv + time ) < freedomFactor ) {}
  // Attract flocks to the center
  vec3 central = vec3( 0., 0., 0. );
  dir = selfPosition - central;
  dist = length( dir );
  dir.y *= 2.5;
  velocity -= normalize( dir ) * delta * 5.;
  for (float y=0.0;y<height;y++) {
    for (float x=0.0;x<width;x++) {
      vec2 ref = vec2( x + 0.5, y + 0.5 ) / resolution.xy;
      birdPosition = texture2D( texturePosition, ref ).xyz;
      dir = birdPosition - selfPosition;
      dist = length(dir);
      if (dist < 0.0001) continue;
      distSquared = dist * dist;
      if (distSquared > zoneRadiusSquared ) continue;
      percent = distSquared / zoneRadiusSquared;
      if ( percent < separationThresh ) { // low
        // Separation - Move apart for comfort
        f = (separationThresh / percent - 1.0) * delta;
        velocity -= normalize(dir) * f;
      } else if ( percent < alignmentThresh ) { // high
        // Alignment - fly the same direction
        float threshDelta = alignmentThresh - separationThresh;
        float adjustedPercent = ( percent - separationThresh ) / threshDelta;
        birdVelocity = texture2D( textureVelocity, ref ).xyz;
        f = ( 0.5 - cos( adjustedPercent * PI_2 ) * 0.5 + 0.5 ) * delta;
        velocity += normalize(birdVelocity) * f;
      } else {
        // Attraction / Cohesion - move closer
        float threshDelta = 1.0 - alignmentThresh;
        float adjustedPercent = ( percent - alignmentThresh ) / threshDelta;
        f = ( 0.5 - ( cos( adjustedPercent * PI_2 ) * -0.5 + 0.5 ) ) * delta;
        velocity += normalize(dir) * f;
      }
    }
  }
  // this make tends to fly around than down or up
  // if (velocity.y > 0.) velocity.y *= (1. - 0.2 * delta);
  // Speed Limits
  if ( length( velocity ) > limit ) {
    velocity = normalize( velocity ) * limit;
  }
  gl_FragColor = vec4( velocity, 1.0 );
}
`;

const birdsVS = `
attribute vec2 reference;
attribute float birdVertex;
attribute vec3 birdColor;
uniform sampler2D texturePosition;
uniform sampler2D textureVelocity;
varying vec4 vColor;
varying float z;
uniform float time;
void main() {
  vec4 tmpPos = texture2D( texturePosition, reference );
  vec3 pos = tmpPos.xyz;
  vec3 velocity = normalize(texture2D( textureVelocity, reference ).xyz);
  vec3 newPosition = position;
  if ( birdVertex == 4.0 || birdVertex == 7.0 ) {
    // flap wings
    newPosition.y = sin( tmpPos.w ) * 5.;
  }
  newPosition = mat3( modelMatrix ) * newPosition;
  velocity.z *= -1.;
  float xz = length( velocity.xz );
  float xyz = 1.;
  float x = sqrt( 1. - velocity.y * velocity.y );
  float cosry = velocity.x / xz;
  float sinry = velocity.z / xz;
  float cosrz = x / xyz;
  float sinrz = velocity.y / xyz;
  mat3 maty =  mat3(
    cosry, 0, -sinry,
    0    , 1, 0     ,
    sinry, 0, cosry
  );
  mat3 matz =  mat3(
    cosrz , sinrz, 0,
    -sinrz, cosrz, 0,
    0     , 0    , 1
  );
  newPosition =  maty * matz * newPosition;
  newPosition += pos;
  z = newPosition.z;
  vColor = vec4( birdColor, 1.0 );
  gl_Position = projectionMatrix *  viewMatrix  * vec4( newPosition, 1.0 );
}
`;

const birdsFS = `
varying vec4 vColor;
varying float z;
uniform vec3 color;
void main() {
  // Fake colors for now
  // float z2 = 0.2 + ( 1000. - z ) / 1000. * vColor.x;
//  gl_FragColor = vec4( z2, z2, z2, 1. );
  gl_FragColor = vColor;
}
`;

/* TEXTURE WIDTH FOR SIMULATION */
var WIDTH = 64;
var BIRDS = WIDTH * WIDTH;
// Custom Geometry - using 3 triangles each. No UVs, no normals currently.
class BirdGeometry extends THREE.BufferGeometry {
  constructor(){
    super();
    this.last = 0;
    var triangles = BIRDS * 3;
    var points = triangles * 3;
    var vertices = new THREE.BufferAttribute( new Float32Array( points * 3 ), 3 );
    var birdColors = new THREE.BufferAttribute( new Float32Array( points * 3 ), 3 );
    var references = new THREE.BufferAttribute( new Float32Array( points * 2 ), 2 );
    var birdVertex = new THREE.BufferAttribute( new Float32Array( points ), 1 );
    this.addAttribute( 'position', vertices );
    this.addAttribute( 'birdColor', birdColors );
    this.addAttribute( 'reference', references );
    this.addAttribute( 'birdVertex', birdVertex );
    // this.addAttribute( 'normal', new Float32Array( points * 3 ), 3 );
    var v = 0;
    function verts_push() {
      for (var i=0; i < arguments.length; i++) {
        vertices.array[v++] = arguments[i];
      }
    }
    var wingsSpan = 20;
    for (var f = 0; f<BIRDS; f++ ) {
      // Body
      verts_push(
        0, -0, -20,
        0, 4, -20,
        0, 0, 30
      );
      // Left Wing
      verts_push(
        0, 0, -15,
        -wingsSpan, 0, 0,
        0, 0, 15
      );
      // Right Wing
      verts_push(
        0, 0, 15,
        wingsSpan, 0, 0,
        0, 0, -15
      );
    }
    for( var v = 0; v < triangles * 3; v++ ) {
      var i = ~~(v / 3);
      var x = (i % WIDTH) / WIDTH;
      var y = ~~(i / WIDTH) / WIDTH;
      var c = new THREE.Color(
        0x666666 +
        ~~(v / 9) / BIRDS * 0x888888
      );
      birdColors.array[ v * 3 + 0 ] = c.r;
      birdColors.array[ v * 3 + 1 ] = c.g;
      birdColors.array[ v * 3 + 2 ] = c.b;
      references.array[ v * 2     ] = x;
      references.array[ v * 2 + 1 ] = y;
      birdVertex.array[ v         ] = v % 9;
    }
    this.scale( 0.2, 0.2, 0.2 );
  }
}

export default class SFGpGpuPass extends THREE.Pass {
	constructor(width,height,renderer){
		  super();
      this.renderer = renderer;
      this.width = width;
      this.height = height;
			this.windowHalfX = width / 2;
			this.windowHalfY = height / 2;
			this.BOUNDS = 800, this.BOUNDS_HALF = this.BOUNDS / 2;
	
			this.gpuCompute = null;;
			this.velocityVariable = null;
			this.positionVariable = null;
			this.positionUniforms = null;
			this.velocityUniforms = null;
			this.birdUniforms = null;
			this.camera = new THREE.PerspectiveCamera( 75, width / height, 1, 3000 );
			this.camera.position.z = 350;
			this.scene = new THREE.Scene();
			this.scene.fog = new THREE.Fog( 0xffffff, 100, 1000 );
      this.initComputeRenderer();
      this.initBirds();
      this.init = Promise.resolve();

      var parameters = {
        minFilter: THREE.LinearFilter,
        magFilter: THREE.LinearFilter,
        format: THREE.RGBAFormat,
        stencilBuffer: false
      };
      var size = new THREE.Vector2();
      renderer.getSize(size);
      this.renderTarget = new THREE.WebGLRenderTarget( size.x, size.y, parameters );
      this.mergeUniforms =  {
        tDiffuse: { value: null },
        tDiffuse1: { value: null },
        opacity: { value: 1.0 }
      };

      let mergeVertexShader =
      `
varying vec2 vUv;
void main()	{
		vUv = uv;
    gl_Position = vec4( position, 1.0 );
  }
`;
      let mergeFragmentShader =
      `
uniform sampler2D tDiffuse;
uniform sampler2D tDiffuse1;
uniform float opacity; 
varying vec2 vUv;
void main()	{
  vec4 c = texture2D( tDiffuse, vUv );
  vec4 c1 = texture2D( tDiffuse1,vUv);
  gl_FragColor = c * (1. - opacity) + c1 * opacity;
  //gl_FragColor = c  + c1;
}
`;
      this.mergeMaterial = new THREE.ShaderMaterial({
      uniforms: this.mergeUniforms,
      vertexShader: mergeVertexShader,
      fragmentShader: mergeFragmentShader
      });

    this.mergeCamera = new THREE.OrthographicCamera(- 1, 1, 1, - 1, 0, 1);
    this.mergeScene = new THREE.Scene();

    this.mergeQuad = new THREE.Mesh(new THREE.PlaneBufferGeometry(2, 2), null);
    this.mergeScene.add(this.mergeQuad);


	}

  setSize(width,height){
    this.width = width;
    this.height = height;
    this.windowHalfX = width / 2;
    this.windowHalfY = height/ 2;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderTarget.setSize(width,height);
  }

  initComputeRenderer(){
    		let gpuCompute = new GPUComputationRenderer( WIDTH, WIDTH, this.renderer );
        this.gpuCompute = gpuCompute;
				var dtPosition = gpuCompute.createTexture();
				var dtVelocity = gpuCompute.createTexture();
				this.fillPositionTexture( dtPosition );
				this.fillVelocityTexture( dtVelocity );
				this.velocityVariable = gpuCompute.addVariable( "textureVelocity", fragmentShaderVelocity, dtVelocity );
				this.positionVariable = gpuCompute.addVariable( "texturePosition", fragmentShaderPosition, dtPosition );

				gpuCompute.setVariableDependencies( this.velocityVariable, [ this.positionVariable, this.velocityVariable ] );
				gpuCompute.setVariableDependencies( this.positionVariable, [ this.positionVariable, this.velocityVariable ] );

				this.positionUniforms = this.positionVariable.material.uniforms;
				this.velocityUniforms = this.velocityVariable.material.uniforms;
				this.positionUniforms.time = { value: 0.0 };
				this.positionUniforms.delta = { value: 0.0 };
				this.velocityUniforms.time = { value: 1.0 };
				this.velocityUniforms.delta = { value: 0.0 };
				this.velocityUniforms.testing = { value: 1.0 };
				this.velocityUniforms.seperationDistance = { value: 1.0 };
				this.velocityUniforms.alignmentDistance = { value: 1.0 };
				this.velocityUniforms.cohesionDistance = { value: 1.0 };
				this.velocityUniforms.freedomFactor = { value: 1.0 };
				this.velocityUniforms.predator = { value: new THREE.Vector3() };
				this.velocityVariable.material.defines.BOUNDS = this.BOUNDS.toFixed( 2 );
				this.velocityVariable.wrapS = THREE.RepeatWrapping;
				this.velocityVariable.wrapT = THREE.RepeatWrapping;
				this.positionVariable.wrapS = THREE.RepeatWrapping;
				this.positionVariable.wrapT = THREE.RepeatWrapping;
				var error = gpuCompute.init();
				if ( error !== null ) {
				    throw error;
				}
  }

  initBirds() {
    var geometry = new BirdGeometry();
    // For Vertex and Fragment
    this.birdUniforms = {
      color: { value: new THREE.Color( 0xff2200 ) },
      texturePosition: { value: null },
      textureVelocity: { value: null },
      time: { value: 1.0 },
      delta: { value: 0.0 },
      tDiffuse: { value: null }
    };
    // ShaderMaterial
    var material = new THREE.ShaderMaterial( {
      uniforms:       this.birdUniforms,
      vertexShader:   birdsVS,
      fragmentShader: birdsFS,
      side: THREE.DoubleSide
    });

    this.birdMesh = new THREE.Mesh( geometry, material );
    this.birdMesh.rotation.y = Math.PI / 2;
    this.birdMesh.matrixAutoUpdate = false;
    this.birdMesh.updateMatrix();
    this.scene.add(this.birdMesh);
  }

  fillPositionTexture( texture ) {
    var theArray = texture.image.data;
    for ( var k = 0, kl = theArray.length; k < kl; k += 4 ) {
      var x = Math.random() * this.BOUNDS - this.BOUNDS_HALF;
      var y = Math.random() * this.BOUNDS - this.BOUNDS_HALF;
      var z = Math.random() * this.BOUNDS - this.BOUNDS_HALF;
      theArray[ k + 0 ] = x;
      theArray[ k + 1 ] = y;
      theArray[ k + 2 ] = z;
      theArray[ k + 3 ] = 1;
    }
  }
  
  fillVelocityTexture( texture ) {
    var theArray = texture.image.data;
    for ( var k = 0, kl = theArray.length; k < kl; k += 4 ) {
      var x = Math.random() - 0.5;
      var y = Math.random() - 0.5;
      var z = Math.random() - 0.5;
      theArray[ k + 0 ] = x * 10;
      theArray[ k + 1 ] = y * 10;
      theArray[ k + 2 ] = z * 10;
      theArray[ k + 3 ] = 1;
    }
  }

  update(time){
    let timeMs = ~~(time * 1000);
    this.now = time;
    var delta = ~~(this.now*1000 - this.last*1000) / 1000;
    if (delta > 1) delta = 1; // safety cap on arge deltas
    this.last = time;
    this.positionUniforms.time.value = timeMs;
    this.positionUniforms.delta.value = delta;
    this.velocityUniforms.time.value = timeMs;
    this.velocityUniforms.delta.value = delta;
    this.birdUniforms.time.value = timeMs;
    this.birdUniforms.delta.value = delta;
    this.velocityUniforms.predator.value.set(Math.cos(Math.sin(time / 4) * Math.PI) * 0.1,Math.sin(Math.cos(time / 4) * Math.PI) * 0.1,0);
    this.gpuCompute.compute();
    this.birdUniforms.texturePosition.value = this.gpuCompute.getCurrentRenderTarget( this.positionVariable ).texture;
    this.birdUniforms.textureVelocity.value = this.gpuCompute.getCurrentRenderTarget( this.velocityVariable ).texture;
  }

	render(renderer, writeBuffer, readBuffer, delta, maskActive){
    
   // this.birdUniforms['tDiffuse'].value = readBuffer.texture;
    this.mergeUniforms['tDiffuse'].value = readBuffer.texture;
    this.mergeUniforms['tDiffuse1'].value = this.renderTarget.texture;
//    this.mergeUniforms['opacity'].value = 0.25;
    this.mergeQuad.material = this.mergeMaterial;

		if ( this.renderToScreen ) {

			renderer.render( this.scene, this.camera,this.renderTarget );
      renderer.render(this.mergeScene,this.mergeCamera);

		} else {

			renderer.render( this.scene, this.camera,this.renderTarget , this.clear );
      renderer.render(this.mergeScene,this.mergeCamera,writeBuffer);

		}

	}
}


