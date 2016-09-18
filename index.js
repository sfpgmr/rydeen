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


  // FFT表示用テクスチャ
  var TEXW = TEXH = 1024;
  var canvas = document.createElement('canvas');
  canvas.width = TEXW;
  canvas.height = TEXH;
  var ctx = canvas.getContext('2d');
  ctx.fillStyle = "rgba(255,255,255,1.0)";
  ctx.fillRect(0,0,TEXW,TEXH);
  var ffttexture = new THREE.Texture(canvas);
  ffttexture.needsUpdate = true;
  var fftgeometry = new THREE.PlaneBufferGeometry(8192,8192,32,32);
  var fftmaterial = new THREE.MeshBasicMaterial({map:ffttexture,transparent:true,overdraw:true,side:THREE.DoubleSide});
  var fftmesh = new THREE.Mesh(fftgeometry,fftmaterial);

  ffttexture.wrapS = THREE.RepeatWrapping;
  ffttexture.wrapT = THREE.RepeatWrapping;
  ffttexture.repeat.set( 8, 8 );

  fftmesh.position.z = 0.0;
  fftmesh.rotation.x = Math.PI / 2;

  var fftmesh2 = fftmesh.clone();
  fftmesh2.position.x += 8192;

  scene.add(fftmesh);
  scene.add(fftmesh2);



  var loadHorseMesh = (()=>{
    return new Promise((resolve,reject)=>{
      loader.load( "./horse.json", ( geometry ) => {

        // meshes[0] = new THREE.Mesh( geometry, new THREE.MeshLambertMaterial( {
        //   vertexColors: THREE.FaceColors,
        //   morphTargets: true
        // } ) );
        let mat = new THREE.MeshPhongMaterial( {
        // vertexColors: THREE.FaceColors,
         // shading: THREE.SmoothShading,
         //transparent:true,
         //map:ffttexture,
        // side:THREE.DoubleSide,
          morphTargets: true
        } );
        mat.color = new THREE.Color(1.0,0.5,0.0);
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
          meshes[i].position.x = (Math.floor((Math.random() - 0.5) * 10)) * 450;
          meshes[i].position.z =  (Math.floor((Math.random() - 0.5) * 10)) * 150;
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

    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillRect(0,0,TEXW,TEXH);
    //ctx.clearRect(0,0,TEXW,TEXH);
     let wsize = 256;

    for(let i = 0;i < wsize;++i){
      var r = 0, l = 0;
      if((waveCount + i) < (chR.length)){
          r = chR[waveCount + i];
          l = chL[waveCount + i];
      }

      let hsl = 'hsl(' + Math.floor(Math.abs(r) * 200 + 250) + ',100%,50%)';
      ctx.fillStyle = hsl;
      if(r>0){
        ctx.fillRect(TEXH/4 - r * TEXH / 4 - TEXW/wsize/2 ,i * TEXW/wsize,r * TEXH / 4,TEXW/wsize);
      } else {
        ctx.fillRect(TEXH/4 - TEXW/wsize/2 ,i * TEXW/wsize,-r * TEXH / 4,TEXW/wsize);
      }

      hsl = 'hsl(' + Math.floor(Math.abs(l) * 200 + 250) + ',100%,50%)';
      ctx.fillStyle = hsl;
      if(l>0){
        ctx.fillRect(TEXH/4 * 3 - r * TEXH / 4 - TEXW/wsize/2 ,i * TEXW/wsize,r * TEXH / 4,TEXW/wsize);
      } else {
        ctx.fillRect(TEXH/4 * 3 - TEXW/wsize/2 ,i * TEXW/wsize,-r * TEXH / 4,TEXW/wsize);
      }


    }

    fftmesh.position.x -= 50;
  
    if(fftmesh.position.x < -4096)
      fftmesh.position.x = 0;

    fftmesh2.position.x -= 50;
  
    if(fftmesh2.position.x < 0)
      fftmesh2.position.x = 8192;

    // fft.forward(chR.subarray(waveCount,waveCount + fftsize));
    // var pw = TEXH / (fftsize/2); 
    // var spectrum = fft.real;
    // for(var x = 0,e = fftsize/2 ;x < e;++x){
    //   let db = -30 + Math.log10(Math.abs(spectrum[x])) * 10;
    //   let h = (120 + db) * TEXH / 240;
    //   let hsl = 'hsl(' + Math.floor((120 + db) / 120 * 150 + 260) + ',100%,50%)';
    //   ctx.fillStyle = hsl;
    //   ctx.fillRect(x * pw,TEXH/2 - h,pw,h);
    // }
    // fft.forward(chL.subarray(waveCount,waveCount + fftsize));
    // spectrum = fft.real;
    // for(var x = 0,e = fftsize/2 ;x < e;++x){
    //   let db = -30 + Math.log10(Math.abs(spectrum[x])) * 10;
    //   let h = (120 + db) * TEXH / 240;
    //   let hsl = 'hsl(' + Math.floor((120 + db) / 120 * 150 + 260) + ',100%,50%)';
    //   ctx.fillStyle = hsl;
    //   ctx.fillRect(x * pw,TEXH / 2,pw,h);
    // }

    waveCount += step;
    if(waveCount >= chR.length){
      window.close();
    }
    
    ffttexture.needsUpdate =true;

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

