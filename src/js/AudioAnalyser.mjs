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
import * as fs from 'fs';
import { format } from 'url';
//var readFile = denodeify(fs.readFile);

const WAVE_FORMAT_PCM = 0x0001; // PCM
const WAVE_FORMAT_IEEE_FLOAT = 0x0003;// IEEE float
const WAVE_FORMAT_ALAW = 0x0006;// 8-bit ITU-T G.711 A-law
const WAVE_FORMAT_MULAW = 0x0007;//		8-bit ITU-T G.711 µ-law
const WAVE_FORMAT_EXTENSIBLE = 0xFFFE;//Determined by SubFormat


export default class Audio {
  constructor(sampleRate){
    this.sampleRate = sampleRate;
    this.context = new AudioContext({sampleRate:sampleRate});
  }
  load(filename) {
    const context = this.context;
    
    function toArrayBuffer(buffer) {
      return new Uint8Array(buffer).buffer;
      // var ab = new ArrayBuffer(buffer.length);
      // var view = new Uint8Array(ab);
      // for (var i = 0; i < buffer.length; ++i) {
      //     view[i] = buffer.readUInt8(i);
      // }
      // return ab;
    }
    let self = this;
   return  fs.promises.readFile(filename)
    .then((data)=>{
        var arrayBuf = toArrayBuffer(data);
        return self.decodeAudio(arrayBuf);
        // context.decodeAudioData(arrayBuf,function(buffer){
        //   if(!buffer){
        //     console.log('error');
        //   }
        //   let source = context.createBufferSource();
        //   //self.source = source;
        //   source.buffer = buffer;
        //   source.connect(context.destination);
        //   let analyser = context.createAnalyser();
        //   //self.analyser = analyser;
        //   source.connect(analyser);
        //   //self.context = context;
        //   resolve(source);
        // },function(err){
        //   reject(err);
        // });
    });
  }


  
  // WAVファイルを解析し、バイト配列として読み込む
  decodeAudio(buffer){
 
    //const buffer = await fs.promises.readFile(filename);
    
    
  
    const view = new DataView(buffer);
    const result = {};

    // RIFF
    result.chunkId = this.getFORCC(view,0);
    result.chunkSize = view.getUint32(4,true);
    result.waveId = this.getFORCC(view,8);

    // fmt chunk
    result.subChunkId = this.getFORCC(view,12);
    result.subChunkSize = view.getUint32(16,true);
    result.formatTag = view.getUint16(20,true);
    result.channels = view.getUint16(22,true);
    result.samplesPerSec = view.getUint32(24,true);
    result.avgBytesPerSec = view.getUint32(28,true);
    result.blockAlign = view.getUint16(32,true);
    result.bitsPerSample = view.getUint16(34,true);

    let offset = 36;

    switch(result.subChunkSize){
      case 16:
        break;
      case 18:
        result.sizeOfExtension = view.getUint16(36,true);
        offset += 22;
        break;
      case 40:
        result.sizeOfExtension = view.getUint16(36,true);
        result.validBitsPerSample = view.getUint16(38,true);
        result.channelMask = view.getUint32(40,true);
        result.subFormat = view.buffer.slice(44,44+16);
        offset = 36 + result.sizeOfExtension + 2;
        break;
      
      default:
        throw new Error('size of subchunk is wrong.');
    }

    // 格納する配列の型を求める
    let ArrayType;
    let dataGetter;
    let byteSize;
    let formatTag = result.formatTag;
    if(result.formatTag == WAVE_FORMAT_EXTENSIBLE){
      formatTag = view.getUint16(44,2);
      result.subFormatTag = formatTag;
    }

    
    switch(formatTag){
      case WAVE_FORMAT_PCM:
        switch(result.bitsPerSample){
          case 8:
            ArrayType = Uint8Array;
            dataGetter = view.getUint8.bind(view);
            byteSize = 1;
            break;
          case 16:
            ArrayType = Int16Array;
            dataGetter = view.getInt16.bind(view);
            byteSize = 2;
            break;
          case 32:
            ArrayType = Int32Array;
            dataGetter = view.getInt32.bind(view);
            byteSize = 4;
            break;
          case 24:
          default:
          throw new Error(`${result.bitsPerSample} bit pcm is not supported.`);
        }
        break;
      case WAVE_FORMAT_IEEE_FLOAT:
        ArrayType = Float32Array;
        dataGetter = view.getFloat32.bind(view);
        byteSize = 4;
        break;
      case WAVE_FORMAT_EXTENSIBLE:
        break;
      case WAVE_FORMAT_ALAW:
      case WAVE_FORMAT_MULAW:
      default:
        throw new Error(`formatTag(${result.formatTag}) is not supported.`);
    }




    while(true){
      const forcc = this.getFORCC(view,offset);
      if(forcc != "data"){
        offset += 4;
        const datasize = view.getUint32(offset,true);
        offset += 4 + datasize;
      } else {
        offset += 4;
        const datasize = view.getUint32(offset,true);
        offset += 4;
        const dataArray = [];
        for(let i = 0;i < result.channels;++i){
          dataArray[i] = new ArrayType(datasize / result.blockAlign);
        }
        for(let j = 0,je = datasize / result.blockAlign;j < je;++j){
          for(let i = 0;i < result.channels;++i){
            dataArray[i][j] = dataGetter(offset,true);
            offset += byteSize;
           }
        }
        result.data = dataArray;
        break;
      }
    }
    console.info(result);
    return result;
  }

  getFORCC(view,offset){
    let result = String.fromCharCode(view.getUint8(offset));
    result += String.fromCharCode(view.getUint8(offset + 1));
    result += String.fromCharCode(view.getUint8(offset + 2));
    result += String.fromCharCode(view.getUint8(offset + 3));
    return result;
  }

  



}
