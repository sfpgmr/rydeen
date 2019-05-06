/**
 * @author SFPGMR
 */
// Shader Sampleより拝借
// https://github.com/mrdoob/three.js/blob/master/examples/webgl_shader.html
"use strict";
//import * as THREE from 'three';
const CHANNEL = 11;
const WAVE_WIDTH = 16384;

let vertexShader =
  `
varying vec2 vUv;
void main()	{
		vUv = uv;
    gl_Position = vec4( position, 1.0 );
  }
`;
let fragmentShader =
  `
uniform sampler2D tDiffuse;
uniform vec2 resolution;
uniform float time;
varying vec2 vUv;
void main()	{

  // vec2 p = -1.0 + 2.0 * gl_FragCoord.xy / resolution.xy;
  vec2 uv = gl_FragCoord.xy / resolution.xy;
  float v = texture2D(tDiffuse, vUv).r;
  if(abs(v - 0.5) < 0.002 ) discard;
  //v = clamp((v - 0.5) * 4.0 + 0.5,0.0,1.0) / (CHANNEL * 2.0);
  v /= (CHANNEL * 2.0);
  float y = floor(uv.y * CHANNEL * 2.0) / (CHANNEL * 2.0) + v;
  //float c = step(abs(uv.y - y),0.0008);
  float c = 1.0 - smoothstep(0.0005,0.001,abs(uv.y - y));
  //float c = clamp(abs(uv.y - y),0.0,1.0);
  
  gl_FragColor = vec4(c,c,c,1.0);
}
`;

//     let geometry = new THREE.PlaneBufferGeometry( 1920, 1080 );
let uniforms = {
  tDiffuse: { value: null },
  resolution: { value: new THREE.Vector2() },
  time: { value: 0.0 }
};

export default class SFShaderPass2 extends THREE.Pass {
  constructor(width, height, fps, endTime, sampleRate = 48000) {
    super();

    this.width = width;
    this.height = height;
    this.time = 0;
    this.chR = [];
    this.chL = [];
    this.amp = [];
    this.fps = fps;
    this.endTime = endTime;
    this.step = sampleRate / fps;
    this.sampleRate = sampleRate;
    this.frameDelta = 30 / fps;
    //this.fftsize = 256;
    //this.fft = new FFT(this.fftsize, sampleRate);
    this.frameSpeed = 1.0 / fps;
    this.delta = this.frameSpeed;
    this.radius = 1000, this.theta = 0;
    this.fftmeshSpeed = 50 * this.frameDelta;

    this.uniforms = THREE.UniformsUtils.clone(uniforms);
    this.uniforms.resolution.value.x = width;
    this.uniforms.resolution.value.y = height;
    this.material = new THREE.ShaderMaterial({
      uniforms: this.uniforms,
      vertexShader: vertexShader,
      fragmentShader: fragmentShader,
      defines: {
        CHANNEL: CHANNEL + '.0'
      }
    });

    this.camera = new THREE.OrthographicCamera(- 1, 1, 1, - 1, 0, 1);
    this.scene = new THREE.Scene();

    this.audioBuffer = new Uint8Array(WAVE_WIDTH * CHANNEL * 2);

    this.texture = new THREE.DataTexture(this.audioBuffer, WAVE_WIDTH, CHANNEL * 2, THREE.LuminanceFormat, THREE.UnsignedByteType);
    this.texture.needsUpdate = true;
    this.quad = new THREE.Mesh(new THREE.PlaneBufferGeometry(2,2), null);
    this.scene.add(this.quad);
    //this.setSize(this.width,this.height);

  }

  setSize(width, height) {
    this.width = this.uniforms.resolution.value.x = width;
    this.height = this.uniforms.resolution.value.y = height;
  }

  update(time) {
    this.time = time;
    let waveCount = ~~(time * this.sampleRate);
    const wsize = WAVE_WIDTH;
    for (let i = 0; i < wsize; ++i) {
      for(let k = 0;k < CHANNEL;++k){
        let r = 0, l = 0;
        if ((waveCount + i) < (this.chR[k].length)) {
          r = this.chR[k][waveCount + i];
          l = this.chL[k][waveCount + i];
        }
        this.audioBuffer[i + k * 2 * wsize] = ((r * this.amp[k] + 1.0) / 2 * 0xff) | 0;
        this.audioBuffer[i + (k * 2 + 1) * wsize] = ((l * this.amp[k] + 1.0) / 2 * 0xff) | 0;
      }
    }
    //this.texture.set(this.audioBuffer);
    this.texture.needsUpdate = true;

  }

  render(renderer, writeBuffer, readBuffer, delta, maskActive) {
    this.uniforms["tDiffuse"].value = this.texture;
    this.uniforms["time"].value = this.time;
    //this.uniforms.needsUpdate = true;
    this.quad.material = this.material;

    if (this.renderToScreen) {

      renderer.render(this.scene, this.camera);

    } else {
      let backup = renderer.getRenderTarget();
      renderer.setRenderTarget(writeBuffer);
      this.clear && renderer.clear();
      renderer.render(this.scene, this.camera);
      renderer.setRenderTarget(backup);

      //renderer.render( this.scene, this.camera, writeBuffer, this.clear );

    }

  }
}

