/**
 * @author SFPGMR
 */
// Shader Sampleより拝借
// https://github.com/mrdoob/three.js/blob/master/examples/webgl_shader.html
"use strict";

import { buffer } from "d3";

 //import * as THREE from 'three';

 let vertexShader =
  `//#version 300 es 
out vec2 vUv;
void main()	{
		vUv = uv;
    //gl_Position =  projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
    gl_Position = vec4( position, 1.0 );
  }
`;
let fragmentShader =
  `//#version 300 es
precision highp float;
precision highp int;

uniform sampler2D ch;
uniform vec2 resolution;
uniform float time;
uniform float amp[CHANNEL_INT];
uniform float amp_current;

in vec2 vUv;
//out vec4 pc_fragColor;

void main()	{
  // vec2 p = -1.0 + 2.0 * gl_FragCoord.xy / resolution.xy;
  int xi = int(vUv.x * X);
  int xsi= int(vUv.x * X * 2.);
  int yi = int(vUv.y * Y);
  int channel = xi + (yi * X_INT);


  if(channel == 23) {
    pc_fragColor = vec4(0.0,0.0,0.0,1.0);
    return;
  }

  float amplitude = amp[channel];
  float y = vUv.y * Y - float(yi);
  float v = 0.0;
  float c = 0.0;

  v = clamp((texture(ch, vUv).r - 0.5) * amplitude + 0.5,0.0,1.0);


  if(abs(v - 0.5) < (0.0025 * amplitude)) {
    pc_fragColor = vec4(0.0,0.0,0.0,1.0);
    return;
  }

  if(v <= 0.5 && y <= 0.5){
    if(y >= v){
      c = 1.0;
    }
  } else if(v > 0.5 && y > 0.5){
    if(y < v){
      c = 1.0;
    }
  }

  if((yi & 0x1) == 0) {
    if((xsi & 0x1) == 0) {
      pc_fragColor = vec4(c,0.0,0.0,1.0);
    } else {
      pc_fragColor = vec4(0.0,c,0.0,1.0);
    }
  } else {
    if((xsi & 0x1) == 0) {
      pc_fragColor = vec4(0.0,0.0,c,1.0);
    } else {
      pc_fragColor = vec4(c,0.0,0.0,1.0);
    }
  }
}
`;

//     let geometry = new THREE.PlaneBufferGeometry( 1920, 1080 );
let uniforms = {
  ch: { value: null },
//  chL: { value: null },
  resolution: { value: new THREE.Vector2() },
  time: { value: 0.0 }
};

export default class SFShaderPass4 extends THREE.Pass {
  constructor(width, height, fps, endTime, sampleRate = 96000,channel,divide,waves) {
    super();
    divide <<= 1;
    this.channel = channel;
    this.divide = divide;
    this.divide_y = Math.ceil(this.channel / (divide >> 1)) | 0;
    this.waveWidth =  width / divide;
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
        CHANNEL_INT: this.channel,
        X: (this.divide >> 1) + '.0',
        X_INT: this.divide  >> 1,
        Y:this.divide_y + '.0',
        Y_INT:this.divide_y
      }
    });

    this.camera = new THREE.OrthographicCamera(- 1, 1, 1, - 1, 0, 1);
    this.scene = new THREE.Scene();

    this.audioBuffer = new Uint8Array(this.waveWidth * divide * this.divide_y);
    //this.audioBufferR = new Uint8Array(this.waveWidth * this.channel);

    this.texture = new THREE.DataTexture(this.audioBuffer, this.waveWidth * divide, this.divide_y, THREE.LuminanceFormat, THREE.UnsignedByteType);
    //this.textureR = new THREE.DataTexture(this.audioBufferR, this.waveWidth, this.channel, THREE.LuminanceFormat, THREE.UnsignedByteType);
    this.texture.needsUpdate = true;
    //this.textureR.needsUpdate = true;
    this.quad = new THREE.Mesh(new THREE.PlaneBufferGeometry(2,2), null);
    this.scene.add(this.quad);
    //this.setSize(this.width,this.height);

  }

  setSize(width, height) {
    this.width = this.uniforms.resolution.value.x = width;
    this.height = this.uniforms.resolution.value.y = height;
  }

  update(time) {
    this.time = time - this.waveWidth / ( 2 * this.sampleRate);
    const wsize = this.waveWidth;
    let waveCount = ~~(time * this.sampleRate) - (this.waveWidth >> 1);

    if(waveCount < 0) waveCount = 0;
    const chParams = [];
    for(let ch = 0,chend = this.channel;ch < chend;++ch){
      const chParam = [];
      const wave = this.waves[ch];
      const wlength = wave.data[0].length;
      for(let wch = 0,wchEnd = wave.data.length;wch < wchEnd;++wch){
        const w = wave.data[wch];
        let max = 0,min = 255;
        for(let wp = waveCount,wpEnd = waveCount + this.waveWidth;wp < wpEnd;++wp){
          if(w[wp] > max) max = w[wp];
          if(w[wp] < min) min = w[wp];
        }
        
        let triggerLevel = (max + min) >> 1;
        let qx = waveCount;
        let qxEnd = (this.waveWidth >> 1) + waveCount;
        if(qxEnd >= w.length) qxEnd = w.length - 1;

        while(w[qx] >= (triggerLevel) && (qx < qxEnd)){
          ++qx;
        }

        let ctr = 0;
        const distances = [];
        while(qx < qxEnd){
          ctr = qx;
          let isUp = false;
          if(w[qx] < triggerLevel){
            while(w[qx] < triggerLevel && qx < qxEnd) qx++;
            isUp = true;
          } else {
            while(w[qx] >= triggerLevel && qx < qxEnd) qx++;
          }

          if(!isUp){
            distances.push([qx - ctr,qx]);
          }
        }

        ctr = 1;
        let highest = [0,qx];
        for(const d of distances){
          if(d[0] > highest[0]){
            highest = [d[0],d[1]];
            ctr = 1;
          } else if(d[0] == highest[0]){
            highest.push(d[1]);
            ++ctr;
          }
        }
        if(ctr != 1) ctr = Math.ceil(ctr / 2);
        chParam.push(highest[ctr]);
      }

      {
        const wdata = wave.data[0];
        const buffer = this.audioBuffer;
        const startPos = chParam[0];
        const waveWidth = this.waveWidth;

        let wcntL = startPos - (waveWidth >> 1);
        if(wcntL < 0)  wcntL = 0;
        let wcntLEnd = wcntL + waveWidth;
        if(wcntLEnd > wlength) wcntLEnd = wlength;
  
        let bufferpos = waveWidth * ch * 2;

        while(wcntL < wcntLEnd){
          buffer[bufferpos] = wdata[wcntL];
          ++wcntL;
          ++bufferpos;
        }
  
        if(bufferpos < (waveWidth * (ch * 2 + 1))){
          buffer.fill(0,bufferpos,waveWidth * (ch * 2 + 1) - 1);
        }
  
      }

      
      {
        const wdata = wave.data[1];
        const buffer = this.audioBuffer;
        const startPos = chParam[1];
        const waveWidth = this.waveWidth;

        let wcntL = startPos  - (waveWidth >> 1);
        if(wcntL < 0)  wcntL = 0;
        let wcntLEnd = wcntL + waveWidth;
        if(wcntLEnd > wlength) wcntLEnd = wlength;
  
        let bufferpos = waveWidth * (ch * 2 + 1);
        while(wcntL < wcntLEnd){
          buffer[bufferpos] = wdata[wcntL];
          ++wcntL;
          ++bufferpos;
        }
  
        if(bufferpos < (waveWidth * (ch * 2 + 2))){
          buffer.fill(0,bufferpos,waveWidth * (ch * 2 + 2) - 1);
        }
  
      }


    }

    // for (let i = 0; i < wsize; ++i) {
    //   for(let k = 0,ke = this.channel;k < ke;++k){
    //     let r = 0, l = 0;
    //     if (waveCount > 0 && (waveCount + i) < (this.waves[k].data[0].length)) {
    //       l = this.waves[k].data[0][waveCount + i];
    //       r = this.waves[k].data[1][waveCount + i];
    //     }
    //     this.audioBufferL[i + k * wsize] = r;// * this.waves[k].amp | 0;
    //     this.audioBufferR[i + k * wsize] = l;// * this.waves[k].amp | 0;
    //   }
    // }
    //this.texture.set(this.audioBuffer);
    this.texture.needsUpdate = true;
    //this.textureR.needsUpdate = true;

  }

  render(renderer, writeBuffer, readBuffer, delta, maskActive) {
    this.uniforms["ch"].value = this.texture;
    //this.uniforms["chL"].value = this.textureL;
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

