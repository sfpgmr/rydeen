/**
 * @author SFPGMR
 */
// Shader Sampleより拝借
// https://github.com/mrdoob/three.js/blob/master/examples/webgl_shader.html
"use strict";
 //import * as THREE from 'three';

 let vertexShader =
  `// #version 300 es 
out vec2 vUv;
void main()	{
		vUv = uv;
    //gl_Position =  projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
    gl_Position = vec4( position, 1.0 );
  }
`;
let fragmentShader =
  `// #version 300 es
precision highp float;
precision highp int;

uniform sampler2D chL;
uniform sampler2D chR;
uniform vec2 resolution;
uniform float time;
uniform float amp[CHANNEL_INT];
uniform float amp_current;

in vec2 vUv;
//out vec4 pc_fragColor;

void main()	{

  // vec2 p = -1.0 + 2.0 * gl_FragCoord.xy / resolution.xy;
  int channel = int(vUv.y * CHANNEL);
  float amplitude = amp[channel];
  float y = vUv.y * CHANNEL - float(channel);

  // channel L
  float l = clamp((texture(chL, vUv).r - 0.5) * amplitude + 0.5,0.0,1.0);
  float cl;
  if(l <= 0.5 && y <= 0.5){
    if(y >= l){
      cl = 1.0;
    }
  } else if(l > 0.5 && y > 0.5){
    if(y < l){
      cl = 1.0;
    }
  }
  // //float l1 = abs(texture(chL,vec2(0.5,vUv.y)).r - 0.5) * 2.0;
  // //if(abs(l - 0.5) > 0.003 ){
  //   {
  //     l = clamp((l - 0.5) * amplitude + 0.5,0.0,1.0) / (CHANNEL);
  //     float y = floor(vUv.y * CHANNEL ) / (CHANNEL) + l;
  //     cl = 1.0 - smoothstep(0.0003,0.001,abs(vUv.y - y));
  //   }
  // //}

  // channel R
   float r = clamp((texture(chR, vec2(1.0 - vUv.x,vUv.y)).r - 0.5) * amplitude + 0.5,0.0,1.0);
   float cr;
   if(r <= 0.5 && y <= 0.5){
     if(y >= r){
       cr = 1.0;
     }
   } else if(r > 0.5 && y > 0.5){
     if(y < r ){
       cr = 1.0;
     }
   }
 //   //float r1 = abs(texture(chR,vec2(0.5,vUv.y)).r - 0.5) * 2.0;
//   //if(abs(r - 0.5) > 0.002 ){
//     {

//       r = clamp((r - 0.5) * amplitude + 0.5,0.0,1.0) / (CHANNEL);
//       float y = floor(vUv.y * CHANNEL) / (CHANNEL) + r;
//       cr = 1.0 - smoothstep(0.0003,0.001,abs(vUv.y - y));
  
//     }
//  // }
//   //float b = max(r1,l1);
//   //cl = clamp(cl + b,0.0,1.0);
//   // cr = clamp(cr + b,0.0,1.0);
  pc_fragColor = (channel & 0x1) == 0 ? vec4(cl,cr,0.0,1.0) : vec4(cl,0.0,cr,1.0);
}
`;

//     let geometry = new THREE.PlaneBufferGeometry( 1920, 1080 );
let uniforms = {
  chR: { value: null },
  chL: { value: null },
  resolution: { value: new THREE.Vector2() },
  time: { value: 0.0 }
};

export default class SFShaderPass3 extends THREE.Pass {
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

    this.audioBufferL = new Uint8Array(this.waveWidth * this.channel);
    this.audioBufferR = new Uint8Array(this.waveWidth * this.channel);

    this.textureL = new THREE.DataTexture(this.audioBufferL, this.waveWidth, this.channel, THREE.LuminanceFormat, THREE.UnsignedByteType);
    this.textureR = new THREE.DataTexture(this.audioBufferR, this.waveWidth, this.channel, THREE.LuminanceFormat, THREE.UnsignedByteType);
    this.textureL.needsUpdate = true;
    this.textureR.needsUpdate = true;
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
        this.audioBufferL[i + k * wsize] = r;// * this.waves[k].amp | 0;
        this.audioBufferR[i + k * wsize] = l;// * this.waves[k].amp | 0;
      }
    }
    //this.texture.set(this.audioBuffer);
    this.textureL.needsUpdate = true;
    this.textureR.needsUpdate = true;

  }

  render(renderer, writeBuffer, readBuffer, delta, maskActive) {
    this.uniforms["chR"].value = this.textureR;
    this.uniforms["chL"].value = this.textureL;
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

