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

/// <reference path="http://cdnjs.cloudflare.com/ajax/libs/d3/3.5.2/d3.js" />
/// <reference path="http://cdnjs.cloudflare.com/ajax/libs/three.js/r70/three.js" />
/// <reference path="../q.intellisense.js" />

var denodeify = require('./denodeify');
var fs = require('fs');
var readFile = denodeify(fs.readFile);

(function(global){
  if(!global.SF){
    global.SF = {};
  }
  if(!global.SF.Audio){
    global.SF.Audio = {};
  } else {
    return;
  }

  function load(){
    var context = new AudioContext();

    function toArrayBuffer(buffer) {
      var ab = new ArrayBuffer(buffer.length);
      var view = new Uint8Array(ab);
      for (var i = 0; i < buffer.length; ++i) {
          view[i] = buffer.readUInt8(i);
      }
      return ab;
    }

   return  readFile('./media/Rydeen3.wav')
    .then(function(data){
      return new Promise((resolve,reject)=>{
        var arrayBuf = toArrayBuffer(data);
        context.decodeAudioData(arrayBuf,function(buffer){
          if(!buffer){
            console.log('error');
          }
          var source = context.createBufferSource();
          source.buffer = buffer;
          source.connect(context.destination);
          var analyser = context.createAnalyser();
          source.connect(analyser);
          SF.Audio.context = context;
          SF.Audio.analyser = analyser;
          SF.Audio.source = source;
          resolve(source);
        },function(err){
          reject(err);
        });
      });
    });
  }
  SF.Audio.load = load;
})(window);