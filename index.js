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

/// <reference path="dsp.js" />
/// <reference path="pathSerializer.js" />
// リリース時にはコメントアウトすること
//document.write('<script src="http://' + (location.host || 'localhost').split(':')[0] +
//':35729/livereload.js?snipver=2"></' + 'script>');

var fs = require('fs');
var denodeify = require('./denodeify'); 
var readFile = denodeify(fs.readFile);
var writeFile = denodeify(fs.writeFile); 

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
  var preview = window.location.hash.match(/preview/ig) != null;
  var WIDTH = 1920, HEIGHT = 1080;
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
  // var camera = new THREE.PerspectiveCamera(90.0, WIDTH / HEIGHT);
  // camera.position.x = 0.0;
  // camera.position.y = 0.0;
  // camera.position.z = (WIDTH / 2.0) * HEIGHT / WIDTH;
  // camera.lookAt(new THREE.Vector3(0.0, 0.0, 0.0));
  camera = new THREE.PerspectiveCamera( 50, window.innerWidth / window.innerHeight, 1, 10000 );
  camera.position.z = 500;
  camera.position.x = 0;
  camera.position.y = 1000;
  camera.target = new THREE.Vector3( 0, 0, 0 );

  var light = new THREE.DirectionalLight( 0xefefff, 1.5 );
  light.position.set( 1, 1, 1 ).normalize();
  scene.add( light );

  var light = new THREE.DirectionalLight( 0xffefef, 1.5 );
  light.position.set( -1, -1, -1 ).normalize();
  scene.add( light );

  var loader = new THREE.JSONLoader();
  var horseAnimSpeed = (60.0 / (143.0));
  var meshes = [];
  var mixers = [];
  var HORSE_NUM = 30;


  var loadHorseMesh = (()=>{
    return new Promise((resolve,reject)=>{
      loader.load( "./horse.json", ( geometry ) => {

        // meshes[0] = new THREE.Mesh( geometry, new THREE.MeshLambertMaterial( {
        //   vertexColors: THREE.FaceColors,
        //   morphTargets: true
        // } ) );
        let mat = new THREE.MeshPhongMaterial( {
         //  vertexColors: THREE.FaceColors,
         // shading: THREE.SmoothShading,
          morphTargets: true
        } );
        mat.color = new THREE.Color(0.0,1.0,0.0);
        //mat.reflectivity = 1.0;
        //mat.specular = new THREE.Color(0.5,0.5,0.5);
        //mat.emissive = new THREE.Color(0.5,0,0);
//        mat.wireframe = true;
        meshes[0] = new THREE.Mesh( geometry, mat);
        

        meshes[0].scale.set( 1.5, 1.5, 1.5 );
        meshes[0].rotation.y = 0.5 * Math.PI;
        meshes[0].position.y = 0;


        for(let i = 1;i < HORSE_NUM;++i){
          meshes[i] = meshes[0].clone();
          meshes[i].position.x = (Math.floor((Math.random() - 0.5) * 200)) * 20;
          meshes[i].position.z =  (Math.floor((Math.random() - 0.5) * 100)) * 20;
          meshes[i].position.y = 0/*(Math.random() - 0.6) * 1000*/;
        }

        for(let i = 0;i< HORSE_NUM;++i){
          scene.add( meshes[i] );
          mixers[i] = new THREE.AnimationMixer( meshes[i] );
          let clip = THREE.AnimationClip.CreateFromMorphTargetSequence( 'gallop', geometry.morphTargets, 30 );
          mixers[i].clipAction( clip ).setDuration( horseAnimSpeed ).play();
        }     
        resolve();
      } );
    });
  })();


//   var horseGroups = [];
//   window.addEventListener('resize', function () {
// //    WIDTH = window.innerWidth;
// //    HEIGHT = window.innerHeight;
//     // renderer.setSize(WIDTH, HEIGHT);
//     // camera.aspect = WIDTH / HEIGHT;
//     // camera.position.z = (WIDTH / 2.0) * HEIGHT / WIDTH;
//     // camera.updateProjectionMatrix();
//   });


  // var gto;
  // try {

  // } catch (e) {
  //   console.log(e + '\n' + e.stack);
  // }

  // FFT表示用テクスチャ

  // var canvas = document.createElement('canvas');
  // canvas.width = WIDTH;
  // canvas.height = HEIGHT;
  // var ctx = canvas.getContext('2d');
  // ctx.fillStyle = "rgba(0,0,0,0.0)";
  // ctx.clearRect(0,0,WIDTH,HEIGHT);
  // var ffttexture = new THREE.Texture(canvas);
  // ffttexture.needsUpdate = true;
  // var fftgeometry = new THREE.PlaneBufferGeometry(2048,2048);
  // var fftmaterial = new THREE.MeshBasicMaterial({map:ffttexture,transparent:true});
  // var fftmesh = new THREE.Mesh(fftgeometry,fftmaterial);
  // fftmesh.position.z = 0.00;

  // scene.add(fftmesh);

  //レンダリング
  var r = 0.0;
  var step = 48000 / 30;
  var fftsize = 256;
  var fft = new FFT(fftsize, 48000);
  var waveCount = 0;
  var index = 0;
  var time = 0.0;
  var frameNo = 0;
  var endTime = 60.0 * 4.0 + 35.0;
  var frameSpeed = 1.0 / 30.0; 
  var delta = frameSpeed;
  var previewCount = 0;
  var chR;
  var chL;
  var timer = 0;
  var pchain = Promise.resolve(0);
  var radius = 1000,theta = 0;
  
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
      window.close();
      return;
    }
    ++frameNo;

    // ctx.fillStyle = 'rgba(0,0,0,0.0)';
    // ctx.clearRect(0,0,WIDTH,HEIGHT);
    // ctx.fillStyle = 'rgba(255,0,0,0.5)';

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
    if(waveCount >= chR.length){
      window.close();
    }
    //ffttexture.needsUpdate =true;

    camera.lookAt( camera.target );

    mixers.forEach((mixer)=>{
      mixer.update(1 / 30);
    });

    camera.position.x = radius * Math.sin( theta );
    camera.position.z = radius * Math.cos( theta );
    theta += 0.01;
	  camera.lookAt( camera.target );

    renderer.render(scene, camera);

    if (!preview) {
      // canvasのtoDataURLを使用した実装
      var data = d3.select('#console').node().toDataURL('image/png');
      data = data.substr(data.indexOf(',') + 1);
      var buffer = new Buffer(data, 'base64');
      writeFile('./temp/out' + ('000000' + frameNo.toString(10)).slice(-6) + '.png', buffer, 'binary')
      .then(renderToFile.bind(this,preview))
      .catch(function(e){
        console.log(err);
      });
    } else {
      // プレビュー
      requestAnimationFrame(renderToFile.bind(null, preview));
      renderer.render(scene, camera);
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
  loadHorseMesh
  .then(SF.Audio.load)
  .then(()=>{
    chL = SF.Audio.source.buffer.getChannelData(0);
    chR = SF.Audio.source.buffer.getChannelData(1);
    renderToFile(preview);
  }).catch(function (e) {
    console.log(e);
  });

});

