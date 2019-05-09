/**
 * @author SFPGMR
 */
// Shader Sampleより拝借
// https://github.com/mrdoob/three.js/blob/master/examples/webgl_shader.html
"use strict";
 //import * as THREE from 'three';

 let vertexShader =
  `#version 300 es 
out vec2 vUv;
void main()	{
		vUv = uv;
    //gl_Position =  projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
    gl_Position = vec4( position, 1.0 );
  }
`;
let fragmentShader =
  `#version 300 es
precision highp float;
precision highp int;

uniform sampler2D tDiffuse;
uniform vec2 resolution;
uniform float time;
uniform float amp[CHANNEL_INT];
uniform float amp_current;

in vec2 vUv;
out vec4 color;

void main()	{

  // vec2 p = -1.0 + 2.0 * gl_FragCoord.xy / resolution.xy;
  float amplitude = amp[int(vUv.y * CHANNEL)];
  float v = texture(tDiffuse, vUv).r;
  float v2 = clamp(abs(texture(tDiffuse,vUv).r - 0.5) * 2.0 * amplitude,0.0,1.0);
  float c = 0.0;
  if(abs(v - 0.5) > 0.003 ){
    v = clamp((v - 0.5) * amplitude + 0.5,0.0,1.0) / (CHANNEL * 2.0);
    float y = floor(vUv.y * CHANNEL * 2.0) / (CHANNEL * 2.0) + v;
    c = 1.0 - smoothstep(0.0003,0.001,abs(vUv.y - y));
  }
  color = vec4(clamp(c + v2,0.0,1.0),c,c,1.0);
}
`;

//     let geometry = new THREE.PlaneBufferGeometry( 1920, 1080 );
let uniforms = {
  tDiffuse: { value: null },
  resolution: { value: new THREE.Vector2() },
  time: { value: 0.0 }
};

export default class SFShaderPass2 extends THREE.Pass {
  constructor(width, height, fps, endTime, sampleRate = 48000,channel,wave_width,waves) {
    super();
    this.channel = channel;
    this.waveWidth = wave_width;
    this.width = width;
    this.height = height;
    this.time = 0;
    this.fps = fps;
    this.endTime = endTime;
    this.step = sampleRate / fps;
    this.sampleRate = sampleRate;
    this.frameDelta = 30 / fps;
    this.waves = waves;
    //this.fftsize = 256;
    //this.fft = new FFT(this.fftsize, sampleRate);
    this.frameSpeed = 1.0 / fps;
    this.delta = this.frameSpeed;
    this.radius = 1000, this.theta = 0;
    this.fftmeshSpeed = 50 * this.frameDelta;
    uniforms.amp = {value:new Array(channel)};

    this.uniforms = THREE.UniformsUtils.clone(uniforms);
    this.uniforms.resolution.value.x = width;
    this.uniforms.resolution.value.y = height;
    for(let i = 0;i < channel;++i){
      this.uniforms.amp.value[i] = this.waves[i].amp;
    }
    this.material = new THREE.ShaderMaterial({
      uniforms: this.uniforms,
      vertexShader: vertexShader,
      fragmentShader: fragmentShader,
      defines: {
        CHANNEL: this.channel + '.0',
        CHANNEL_INT: this.channel
      }
    });

    this.camera = new THREE.OrthographicCamera(- 1, 1, 1, - 1, 0, 1);
    this.scene = new THREE.Scene();

    this.audioBuffer = new Uint8Array(this.waveWidth * this.channel * 2);

    this.texture = new THREE.DataTexture(this.audioBuffer, this.waveWidth, this.channel * 2, THREE.LuminanceFormat, THREE.UnsignedByteType);
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
    this.time = time - this.waveWidth / ( 2 *this.sampleRate);
    let waveCount = ~~(time * this.sampleRate);
    const wsize = this.waveWidth;
    for (let i = 0; i < wsize; ++i) {
      for(let k = 0,ke = this.channel;k < ke;++k){
        let r = 0, l = 0;
        if (waveCount > 0 && (waveCount + i) < (this.waves[k].data[0].length)) {
          l = this.waves[k].data[0][waveCount + i];
          r = this.waves[k].data[1][waveCount + i];
        }
        this.audioBuffer[i + k * 2 * wsize] = r;// * this.waves[k].amp | 0;
        this.audioBuffer[i + (k * 2 + 1) * wsize] = l;// * this.waves[k].amp | 0;
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

