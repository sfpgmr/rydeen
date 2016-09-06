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
/// <reference path="..\intellisense\q.intellisense.js" />
/// <reference path="dsp.js" />
/// <reference path="pathSerializer.js" />
// リリース時にはコメントアウトすること
//document.write('<script src="http://' + (location.host || 'localhost').split(':')[0] +
//':35729/livereload.js?snipver=2"></' + 'script>');

var fs = require('fs');

// from gist
// https://gist.github.com/gabrielflorit/3758456
function createShape(geometry, color, x, y, z, rx, ry, rz, s) {
  // flat shape

  // var geometry = new THREE.ShapeGeometry( shape );
  var material = new THREE.MeshBasicMaterial({
    color: color,
    side: THREE.DoubleSide,
    overdraw: true
  });

  var mesh = new THREE.Mesh(geometry, material);
  mesh.position.set(x, y, z);
  mesh.rotation.set(rx, ry, rz);
  mesh.scale.set(s, s, s);

  return mesh;
}

// メイン
window.addEventListener('load', function () {

  var preview = window.location.search.match(/preview/ig);
  var WIDTH = window.innerWidth, HEIGHT = window.innerHeight;
  var renderer = new THREE.WebGLRenderer({ antialias: false, sortObjects: true });
  renderer.setSize(WIDTH, HEIGHT);
  renderer.setClearColor(0x000000, 1);
  renderer.domElement.id = 'console';
  renderer.domElement.className = 'console';
  renderer.domElement.style.zIndex = 0;

  d3.select('#content').node().appendChild(renderer.domElement);
//  var ctx2d = d3.select('#console').node().getContext('2d');

  renderer.clear();
  // シーンの作成
  var scene = new THREE.Scene();

  // カメラの作成
  var camera = new THREE.PerspectiveCamera(90.0, WIDTH / HEIGHT);
  camera.position.x = 0.0;
  camera.position.y = 0.0;
  camera.position.z = (WIDTH / 2.0) * HEIGHT / WIDTH;
  camera.lookAt(new THREE.Vector3(0.0, 0.0, 0.0));

  var horseGroups = [];
  window.addEventListener('resize', function () {
    WIDTH = window.innerWidth;
    HEIGHT = window.innerHeight;
    renderer.setSize(WIDTH, HEIGHT);
    camera.aspect = WIDTH / HEIGHT;
    camera.position.z = (WIDTH / 2.0) * HEIGHT / WIDTH;
    camera.updateProjectionMatrix();
  });


  var gto;
  try {
    var shapes = [];
    for (var i = 0; i < 11; ++i) {
      var id = 'horse' + ('0' + i).slice(-2);
      var path = fs.readFileSync('./media/' + id + '.json', 'utf-8');
      // デシリアライズ
      shape = SF.deserialize(JSON.parse(path)).toShapes();
      var shapeGeometry = new THREE.ShapeGeometry(shape);
      shapes.push({ name: id, shape: shapeGeometry });
    }

    var ggroup = new THREE.Group();
    for (var i = 0; i < 1; ++i) {
      var group = new THREE.Group();
      shapes.forEach(function (sm) {
        var shapeMesh = createShape(sm.shape, 0xFFFF00, 0, 0, 0, 0, 0, 0, 1.0);
        shapeMesh.visible = false;
        shapeMesh.name = sm.name;
        group.add(shapeMesh);
      });
      group.position.x = 0;
      group.position.y = 0;
      //        group.position.z = 2000.0 * Math.random() - 1000.0;
      horseGroups.push(group);
      ggroup.add(group);
    }
    scene.add(ggroup);
    ggroup.name = 'world';

    d3.select('#svg').remove();
  } catch (e) {
    console.log(e + '\n' + e.stack);
  }

  // FFT表示用テクスチャ

  var canvas = document.createElement('canvas');
  canvas.width = WIDTH;
  canvas.height = HEIGHT;
  var ctx = canvas.getContext('2d');
  ctx.fillStyle = "rgba(0,0,0,0.0)";
  ctx.clearRect(0,0,WIDTH,HEIGHT);
  var ffttexture = new THREE.Texture(canvas);
  ffttexture.needsUpdate = true;
  var fftgeometry = new THREE.PlaneBufferGeometry(WIDTH,HEIGHT);
  var fftmaterial = new THREE.MeshBasicMaterial({map:ffttexture,transparent:true});
  var fftmesh = new THREE.Mesh(fftgeometry,fftmaterial);
  fftmesh.position.z = 0.00;

  scene.add(fftmesh);

  //レンダリング
  var r = 0.0;
  var step = 48000 / 30;
  var fftsize = 256;
  var fft = new FFT(fftsize, 48000);
  var waveCount = 0;
  var index = 0;
  var horseAnimSpeed = (60.0 / (143.0 * 11.0));
  var time = 0.0;
  var frameNo = 0;
  var endTime = 60.0 * 4.0 + 35.0;
  var frameSpeed = 1.0 / 30.0; 
  var delta = frameSpeed;
  var previewCount = 0;
  var chR;
  var chL;
  
  function renderToFile(preview) {
    if (preview) {
      // プレビュー
      previewCount++;
      if ((previewCount & 1) == 0) {
        requestAnimationFrame(renderToFile.bind(renderToFile, true));
        return;
      }
    }
    delta -= horseAnimSpeed;
    if (delta < 0) {
      delta += frameSpeed;
      ++index;
      if (index > 10) { index = 0; }
    }
    time += frameSpeed;
    if (time > endTime) {
      if (parent) {
        parent.postMessage('end','*');
      }
      window.close();
      return;
    }
    ++frameNo;
    var idx = parseInt(index,10);
    for (var i = 0, end = horseGroups.length; i < end; ++i) {
      var g = horseGroups[i];
      g.getObjectByName('horse' + ('00' + idx.toString(10)).slice(-2)).visible = true;
      if (idx == 0) {
        g.getObjectByName('horse10').visible = false;
      } else {
        g.getObjectByName('horse' + ('00' + (idx - 1).toString(10)).slice(-2)).visible = false;
      }
    }   

    ctx.fillStyle = 'rgba(0,0,0,0.0)';
    ctx.clearRect(0,0,WIDTH,HEIGHT);
    ctx.fillStyle = 'rgba(255,0,0,0.5)';

    // fft.forward(chR.subarray(waveCount,waveCount + fftsize));
    // var spectrum = fft.real;
    // for(var x = 0,e = fftsize / 2;x < e;++x){
    //   var h = Math.abs(spectrum[x]) * HEIGHT / 8;
    //   ctx.fillRect(x * 8 + 100,HEIGHT / 2 - h,5,h);
    // }
    // fft.forward(chL.subarray(waveCount,waveCount + fftsize));
    // spectrum = fft.real;
    // for(var x = 0,e = fftsize / 2;x < e;++x){
    //   var h = Math.abs(spectrum[x]) * HEIGHT / 8;
    //   ctx.fillRect(x * 8 + 100,HEIGHT / 2,5,h);
    // }

    waveCount += step;
    if(waveCount > chR.length){
      if(parent){
        parent.postMessage("end");
      }
      window.close();
    }
    ffttexture.needsUpdate =true;

    renderer.render(scene, camera);

    if (!preview) {
      // canvasのtoDataURLを使用した実装
      var data = d3.select('#console').node().toDataURL('image/png');
      data = data.substr(data.indexOf(',') + 1);
      var buffer = new Buffer(data, 'base64');
      Q.nfcall(fs.writeFile, './temp/out' + ('000000' + frameNo.toString(10)).slice(-6) + '.png', buffer, 'binary')
      .then(renderToFile)
      .catch(function(e){
        console.log(err);
      });
    } else {
      // プレビュー
      requestAnimationFrame(renderToFile.bind(renderToFile, true));
    }
  }

  //function render(index) {
  //  index += 0.25;
  //  if (index > 10.0) index = 0.0;
  //  var idx = parseInt(index, 10);
  //  for (var i = 0, end = horseGroups.length; i < end; ++i) {
  //    var g = horseGroups[i];
  //    g.getObjectByName('horse' + ('00' + idx.toString(10)).slice(-2)).visible = true;
  //    if (idx == 0) {
  //      g.getObjectByName('horse10').visible = false;
  //    } else {
  //      g.getObjectByName('horse' + ('00' + (idx - 1).toString(10)).slice(-2)).visible = false;
  //    }
  //  }
  //  renderer.render(scene, camera);
  //};

  SF.Audio.load().then(function () {
    chL = SF.Audio.source.buffer.getChannelData(0);
    chR = SF.Audio.source.buffer.getChannelData(1);
    renderToFile(preview);
  }).catch(function (e) {
    console.log(e);
  });

});

