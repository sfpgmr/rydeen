//
//The MIT License (MIT)
//
//Copyright (c) 2015 Satoshi Fujiwara
//
//Permission is hereby granted, free of charge, to any person obtaining a copy
//of this software and associated documentation files (the "Software"), to deal
//in the Software without restriction, including without limitation the rights
//to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
//copies of the Software, and to permit persons to whom the Software is
//furnished to do so, subject to the following conditions:
//
//The above copyright notice and this permission notice shall be included in
//all copies or substantial portions of the Software.
//
//THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
//IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
//FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
//AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
//LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
//OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
//THE SOFTWARE.

import denodeify from './denodeify.mjs';
import *  as fs  from 'fs';

var readFile = denodeify(fs.readFile);

export default class Audio {
  constructor(sampleRate){
    this.sampleRate = sampleRate;
    this.context = new AudioContext({sampleRate:sampleRate});
  }
  load(filename) {
    const context = this.context;
    
    function toArrayBuffer(buffer) {
      var ab = new ArrayBuffer(buffer.length);
      var view = new Uint8Array(ab);
      for (var i = 0; i < buffer.length; ++i) {
          view[i] = buffer.readUInt8(i);
      }
      return ab;
    }
    let self = this;
   return  readFile(filename)
    .then(function(data){
      return new Promise((resolve,reject)=>{
        var arrayBuf = toArrayBuffer(data);
        self.decodeAudio(arrayBuf);
        context.decodeAudioData(arrayBuf,function(buffer){
          if(!buffer){
            console.log('error');
          }
          let source = context.createBufferSource();
          //self.source = source;
          source.buffer = buffer;
          source.connect(context.destination);
          let analyser = context.createAnalyser();
          //self.analyser = analyser;
          source.connect(analyser);
          //self.context = context;
          resolve(source);
        },function(err){
          reject(err);
        });
      });
    });
  }

  // WAVファイルを解析し、バイト配列として読み込む
  decodeAudio(buffer){
//    const buffer = await fs.readFile(filename);
    const view = new DataView(buffer);
    const result = {};

    result.chunkId = this.getFORCC(view,0);

    result.chunkSize = view.getUint32(4,true);

    result.format = this.getFORCC(view,8);

    result.subChunkId = this.getFORCC(view,12);
    
    result.subChunkSize = view.getUint32(16,true);

    result.audioFormat = view.getUint16(20,true);
    result.channels = view.getUint16(22,true);
    result.samplesPerSec = view.getUint32(24,true);
    result.avgBytesPerSec = view.getUint32(28,true);
    result.blockAlign = view.getUint16(32,true);
    result.bitsPerSample = view.getUint16(34,true);

    let offset = 36;

    if(result.subChunkSize > 36){
      result.sizeOfExtension = view.getUint16(36,true);
      result.validBitsPerSample = view.getUint16(38,true);
      result.channelMask = view.getUint16(40,true);
      result.subFormat = view.buffer.slice(42,42+16);
      offset = 36 + result.sizeOfExtension + 2;
    }

    result.dataId = this.getFORCC(view,offset);

    console.log(result);

  }

  getFORCC(view,offset){
    let result = String.fromCharCode(view.getUint8(offset));
    result += String.fromCharCode(view.getUint8(offset + 1));
    result += String.fromCharCode(view.getUint8(offset + 2));
    result += String.fromCharCode(view.getUint8(offset + 3));
    return result;
  }

  



}
