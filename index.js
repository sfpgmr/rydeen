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
"use strict";

var fs = require('fs');
var sf = require('./pathSerializer');
var denodeify = require('./denodeify'); 
var TWEEN = require('tween.js');
var readFile = denodeify(fs.readFile);
var writeFile = denodeify(fs.writeFile); 
var TimeLine = require('./TimeLine');
var nativeImage = require('electron').nativeImage;
var sharp = require('sharp');
var QueryString = require('./QueryString');
var SF8Pass = require('./SF8Pass');
var SFShaderPass = require('./SFShaderPass');
var SFCapturePass = require('./SFCapturePass');


function saveImage(buffer,path,width,height)
{
  return new Promise((resolve,reject)=>{
    sharp(buffer,{raw:{width:width,height:height,channels:4}})
    .rotate(180)
    .jpeg()
    .toFile(path,(err)=>{
      if(err) reject(err);
      resolve();      
    });
  });

}

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

var time;

// メイン
window.addEventListener('load', function () {
  var qstr = new QueryString();
  var params = qstr.parse(window.location.search.substr(1));
  var preview = params.preview == 'true';
  const fps = parseFloat(params.framerate);
  const WIDTH = window.innerWidth , HEIGHT = window.innerHeight;
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
  //scene.fog = new THREE.Fog( 0x000000, -1000, 8000 );

  // カメラの作成
  // var camera = new THREE.PerspectiveCamera(90.0, WIDTH / HEIGHT);
  // camera.position.x = 0.0;
  // camera.position.y = 0.0;
  // camera.position.z = (WIDTH / 2.0) * HEIGHT / WIDTH;
  // camera.lookAt(new THREE.Vector3(0.0, 0.0, 0.0));
  var camera = new THREE.PerspectiveCamera( 50, window.innerWidth / window.innerHeight, 1, 10000 );
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
  var HORSE_NUM = 40;


  // FFT表示用テクスチャ
  var TEXW = 1024;
  var TEXH = 1024;
  var canvas = document.createElement('canvas');
  canvas.width = TEXW;
  canvas.height = TEXH;
  var ctx = canvas.getContext('2d');
  ctx.fillStyle = "rgba(255,255,255,1.0)";
  ctx.fillRect(0,0,TEXW,TEXH);
  var ffttexture = new THREE.Texture(canvas);
  var ffttexture2 = new THREE.Texture(canvas);
  ffttexture.needsUpdate = true;
  ffttexture2.needsUpdate = true;
  var fftgeometry = new THREE.PlaneBufferGeometry(8192,8192,32,32);
  var fftmaterial = new THREE.MeshBasicMaterial({map:ffttexture2,transparent:true,overdraw:true,opacity:1.0,side:THREE.DoubleSide});
  var fftmesh = new THREE.Mesh(fftgeometry,fftmaterial);

  ffttexture2.wrapS = THREE.RepeatWrapping;
  ffttexture2.wrapT = THREE.RepeatWrapping;
  ffttexture2.repeat.set( 6, 1 );

  ffttexture.wrapS = THREE.RepeatWrapping;
  ffttexture.wrapT = THREE.RepeatWrapping;
  ffttexture.repeat.set( 1, 1 );

  fftmesh.position.z = 0.0;
  fftmesh.rotation.x = Math.PI / 2;

  var fftmesh2 = fftmesh.clone();
  fftmesh2.position.x += 8192;

  scene.add(fftmesh);
  scene.add(fftmesh2);

  var wgeometry = new THREE.CylinderGeometry(512,512,32768,32,32,true);
  wgeometry.rotateY(Math.PI / 2);
  var wmesh =  new THREE.Mesh(wgeometry,new THREE.MeshBasicMaterial({map:ffttexture,transparent:true,side:THREE.DoubleSide}));
  wmesh.position.x = 0;
  wmesh.position.y = 0;
  wmesh.rotation.y = Math.PI / 2;
  wmesh.rotation.z = Math.PI / 2;
  wmesh.position.z = 0;
  scene.add(wmesh);
  camera.position.z = 1000;
  camera.position.x = 0;
  camera.position.y = 0;

  var horseMaterial;
  var horseGroup = new THREE.Group();
  // 馬メッシュのロード
  var loadHorseMesh = (()=>{
    return new Promise((resolve,reject)=>{
      loader.load( "./horse.json", ( geometry ) => {

        // meshes[0] = new THREE.Mesh( geometry, new THREE.MeshLambertMaterial( {
        //   vertexColors: THREE.FaceColors,
        //   morphTargets: true
        // } ) );
        //geometry.computeVertexNormals();
        let mat = new THREE.MeshPhongMaterial( {
        // vertexColors: THREE.FaceColors,
         // shading: THREE.SmoothShading,
         //transparent:true,
         //map:ffttexture,
         side:THREE.DoubleSide,
            //morphNormals: true,
           // color: 0xffffff,
						morphTargets: true,
            transparent: true,
            opacity:0.0,
            //blending:THREE.AdditiveBlending,
            color:new THREE.Color(1.0,0.5,0.0),
						//morphNormals: true,
						//shading: THREE.SmoothShading
            //morphTargets: true
        } );
        horseMaterial = mat;
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
//           meshes[i].material =  new THREE.MeshPhongMaterial( {
//         // vertexColors: THREE.FaceColors,
//          // shading: THREE.SmoothShading,
//          //transparent:true,
//          //map:ffttexture,
//         // side:THREE.DoubleSide,
// //            morphNormals: true,
//            // color: 0xffffff,
// 						morphTargets: true,
//             transparent: true,
//             opacity:0.5,
//                         color:new THREE.Color(1.0,0.5,0.0)

// 						//morphNormals: true,
// 						//shading: THREE.SmoothShading//,
//             //morphTargets: true
//         } );;
          meshes[i].position.x = (Math.floor((Math.random() - 0.5) * 10)) * 450;
          meshes[i].position.z =  (Math.floor((Math.random() - 0.5) * 10)) * 150;
          meshes[i].position.y = 0/*(Math.random() - 0.6) * 1000*/;
        }

        for(let i = 0;i< HORSE_NUM;++i){
          horseGroup.add(meshes[i]);
          //scene.add( meshes[i] );
          mixers[i] = new THREE.AnimationMixer( meshes[i] );
          let clip = THREE.AnimationClip.CreateFromMorphTargetSequence( 'gallop', geometry.morphTargets ,fps);
          mixers[i].clipAction( clip ).setDuration( horseAnimSpeed ).play();
        }
        horseGroup.visible = false;
        scene.add(horseGroup);     
        resolve();
      } );
    });
  })();


  // var gto;
  // var horseGroups = [];
  // try {
  //   var shapes = [];
  //   for (var i = 0; i < 11; ++i) {
  //     var id = 'horse' + ('0' + i).slice(-2);
  //     var path = fs.readFileSync('./media/' + id + '.json', 'utf-8');
  //     // デシリアライズ
  //     shape = sf.deserialize(JSON.parse(path));
      
  //     shape = shape.toShapes();
  //     var shapeGeometry = new THREE.ShapeGeometry(shape);
  //     shapes.push({ name: id, shape: shapeGeometry });
  //   }

  //   var ggroup = new THREE.Group();
  //   for (var i = 0; i < 1; ++i) {
  //     var group = new THREE.Group();
  //     shapes.forEach(function (sm) {
  //       var shapeMesh = createShape(sm.shape, 0xFFFF00, 0, 0, 0, 0, 0, 0, 1.0);
  //       shapeMesh.visible = false;
  //       shapeMesh.name = sm.name;
  //       group.add(shapeMesh);
  //     });
  //     group.position.x = 0;
  //     group.position.y = 0;
  //     group.position.z = 0.0;
  //     horseGroups.push(group);
  //     ggroup.add(group);
  //   }
  //   scene.add(ggroup);
  //   ggroup.name = 'world';

  //   //d3.select('#svg').remove();
  // } catch (e) {
  //   console.log(e + '\n' + e.stack);
  // }

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
  var step = 48000 / fps;
  var frameDelta = 30 / fps;
  var fftsize = 256;
  var fft = new FFT(fftsize, 48000);
  var waveCount = 0;
  var index = 0;
  time = 0;//(60420 - 1500) /1000 ;//0.0;
  var frameNo = 0;
  var endTime = 60.0 * 4.0 + 30.0;
  var frameSpeed = 1.0 / fps; 
  var delta = frameSpeed;
  var previewCount = 0;
  var chR;
  var chL;
  var timer = 0;
  var pchain = Promise.resolve(0);
  var radius = 1000,theta = 0;
  var fftmeshSpeed = 50 * frameDelta;
  var writeFilePromises = []; 

  // 馬のフェードイン・フェードアウト
  function horseFadein(){
    let fadein = new TWEEN.Tween({opacity:0});
    fadein.to({opacity:1.0},5000);
    fadein.onUpdate(function(){
        meshes.forEach((d)=>{
          d.material.opacity = this.opacity;
        });
    });
    fadein.onStart(()=>{
      horseGroup.visible = true;
    });
    return fadein.start.bind(fadein);
  }

  function horseFadeout(){
    var fadeout = new TWEEN.Tween({opacity:1.0});
    fadeout.to({opacity:0.0},3000);
    fadeout.onUpdate(function(){
        meshes.forEach((d)=>{
          d.material.opacity = this.opacity;
        });
    });
    fadeout.onComplete(()=>{
      horseGroup.visible = false;
    });

    return fadeout.start.bind(fadeout);
  }

 // シリンダーの回転
 function rotateCilynder(){
  let rotateCilynder = new TWEEN.Tween({time:0});
  var ry = 0;
  rotateCilynder
  .to({time:endTime},1000 * endTime)
  .onUpdate(function(){
    //camera.position.x = radius * Math.sin( theta );
    //camera.rotation.z += 0.1;//radius * Math.cos( theta );
    //wmesh.rotation.x += 0.01;
    //wmesh.geometry.rotateY(0.05 * frameDelta);
    //theta += 0.01 * frameDelta;
	  //ry += 0.001 * frameDelta;
    camera.lookAt( camera.target );
  });
  return rotateCilynder;
 }

  // カメラワーク

  function cameraTween(){
    let cameraTween = new TWEEN.Tween({x:0,y:0,z:1000,opacity:1.0});
    cameraTween.to({x:0,z:radius,y:2000,opacity:0.0},1000);
    //cameraTween.delay(20.140 * 1000 - 1500);
    cameraTween.onUpdate(function(){
      fftmesh.material.opacity = 1.0 - this.opacity;
      fftmesh2.material.opacity = 1.0 - this.opacity;
      wmesh.material.opacity = this.opacity;
      camera.position.x = this.x;
      camera.position.y = this.y;
    });
    cameraTween.onStart(function(){
      fftmesh.visible = true;
      fftmesh2.visible = true;
    });
    cameraTween.onComplete(function(){
      wmesh.visible = false;
    });
    var cameraTween11 = new TWEEN.Tween({theta:0});
    cameraTween11.to({theta:-2 * Math.PI},11587);
    cameraTween11.onUpdate(function(){
      camera.position.x = Math.sin(this.theta) * radius;
      camera.position.z = Math.cos(this.theta) * radius;
    });
    cameraTween.chain(cameraTween11);
    return cameraTween;
  }

  function cameraTween2(){
    let cameraTween2 = new TWEEN.Tween({x:0,y:2000,z:1000,opacity:0.0});
    cameraTween2.to({x:0,y:0,opacity:1.0},1000);
    cameraTween2.onUpdate(function(){
      fftmesh.material.opacity = 1.0 - this.opacity;
      fftmesh2.material.opacity = 1.0 - this.opacity;
      wmesh.material.opacity = this.opacity;
      camera.position.x = this.x;
      camera.position.y = this.y;
    });
    cameraTween2.onStart(function(){
      wmesh.visible = true;
    });
    cameraTween2.onComplete(function(){
      fftmesh.visible = false;
      fftmesh2.visible = false;
    });
    return cameraTween2;
  }

  function cameraTween4(){
    let cameraTween4 = new TWEEN.Tween({x:0,y:2000,z:1000,opacity:1.0});
    cameraTween4.to({x:0,y:1000,z:1000},1000);
    cameraTween4.onUpdate(function(){
      camera.position.x = this.x;
      camera.position.y = this.y;
    });
    var cameraTween41 = new TWEEN.Tween({theta:0});
    cameraTween41.to({theta:2 * Math.PI},18300);
    cameraTween41.onUpdate(function(){
      camera.position.x = Math.sin(this.theta) * radius;
      camera.position.z = Math.cos(this.theta) * radius;
    });
    cameraTween4.chain(cameraTween41);

    return cameraTween4;
  }

  // Particles
  
  {
    let material = new THREE.SpriteMaterial({
      map: new THREE.CanvasTexture(generateSprite()),
      blending: THREE.AdditiveBlending,
      transparent: true
    });
    for (var i = 0; i < 1000; i++) {
      let p = new THREE.Sprite(material);
      p.visible = false;
      initParticle(p, 207.273 * 1000 - 1500 + i * 10);
      scene.add(p);
    }
  }

  // Post Effect

  let composer = new THREE.EffectComposer(renderer);
  let renderPass = new THREE.RenderPass(scene, camera);
  composer.addPass(renderPass);
  composer.setSize(WIDTH, HEIGHT);


  let sfShaderPass = new SFShaderPass(WIDTH,HEIGHT);
  sfShaderPass.enabled = true;
  sfShaderPass.renderToScreen = false;
  composer.addPass(sfShaderPass);

  
  let glitchPass = new THREE.GlitchPass();
  glitchPass.renderToScreen = false;
  glitchPass.enabled = true;
  glitchPass.goWild = false;
  composer.addPass( glitchPass );

  let dotScreen = new THREE.ShaderPass(THREE.DotScreenShader);
  dotScreen.uniforms['scale'].value = 4;
  dotScreen.enabled = false;
  dotScreen.renderToScreen = false;

  composer.addPass(dotScreen);

  let sf8Pass = new SF8Pass();
//  rgbShift.uniforms['amount'].value = 0.0035;
  sf8Pass.enabled = true;
  sf8Pass.renderToScreen = preview;
  composer.addPass(sf8Pass);

  // let rgbShift = new THREE.SF8Pass(THREE.RGBShiftShader);
  // rgbShift.uniforms['amount'].value = 0.0035;
  // rgbShift.enabled = false;
  // rgbShift.renderToScreen = false;
  // composer.addPass(rgbShift);

  let sfCapturePass;
  if(!preview){
    sfCapturePass = new SFCapturePass(WIDTH,HEIGHT);
    sfCapturePass.enabled = true;
    sfCapturePass.renderToScreen = true;
    composer.addPass(sfCapturePass);
  }



  //renderPass.renderToScreen = true;

  function start(tween){
    let t = tween();
    return t.start.bind(t);
  }

  function fillEffect(){
    return  new TWEEN.Tween({})
      .to({},40)
      .onStart(()=>{
        glitchPass.goWild = true;
      })
      .onComplete(()=>{
        glitchPass.goWild = false;
      });
  }

  // 間奏
  function intEffect(){
    return  new TWEEN.Tween({})
      .to({},25.175 * 1000)
      .onUpdate(()=>{
        dotScreen.uniforms['scale'].value = (chR[waveCount] + chL[waveCount]) * 8 + 1;
      })
      .onStart(()=>{
        dotScreen.enabled = true;
      })
      .onComplete(()=>{
        dotScreen.enabled = false;
      });
  }

  function intEffect2(){
    return  new TWEEN.Tween({})
      .to({},80)
      .onUpdate(()=>{
      })
      .onStart(()=>{
        dotScreen.enabled = false;
      })
      .onComplete(()=>{
        dotScreen.enabled = true;
      });
  }

  // テクスチャのアップデート



  var events = [
    // 馬のフェードイン・フェードアウト
    {time:60420 - 1500,func:horseFadein()},
    {time:60240 + 20140 - 3000 - 1500,func:horseFadeout()},
    {time:134266 - 1500,func:horseFadein()},
    {time:134266 + 20140 - 3000 - 1500,func:horseFadeout()},
    // シリンダーの回転
    {time:0,func:start(rotateCilynder)},
    // カメラワーク
    {time:20.140 * 1000 - 1500,func:start(cameraTween)},
    {time:32.727 * 1000 - 1500,func:start(cameraTween2)},
    {time:46.993 * 1000 - 1500,func:start(cameraTween)},
    {time:60.420 * 1000 - 1500,func:start(cameraTween4)},
    {time:79.720 * 1000 - 1500,func:start(cameraTween2)},
    {time:93.986 * 1000 - 1500,func:start(cameraTween)},
    {time:106.573 * 1000 - 1500,func:start(cameraTween2)},
    {time:120.839 * 1000 - 1500,func:start(cameraTween)},
    {time:133.427 * 1000 - 1500,func:start(cameraTween4)},
    {time:180.420 * 1000 - 1500,func:start(cameraTween2)},
    // drums fill
    {time:5.874 * 1000 - 1500,func:start(fillEffect)},
    {time:6.294 * 1000 - 1500,func:start(fillEffect)},

    {time:19.510 * 1000 - 1500 ,func:start(fillEffect)},
    {time:19.510 * 1000 - 1500 + 105,func:start(fillEffect)},
    {time:19.510 * 1000 - 1500 + 105 * 2,func:start(fillEffect)},
    {time:19.510 * 1000 - 1500 + 105 * 3,func:start(fillEffect)},
    {time:19.510 * 1000 - 1500 + 105 * 4,func:start(fillEffect)},

    {time:32.727 * 1000 - 1500,func:start(fillEffect)},
    {time:32.727 * 1000 - 1500 + 420,func:start(fillEffect)},

    {time:46.364 * 1000 - 1500 ,func:start(fillEffect)},
    {time:46.364 * 1000 - 1500 + 105,func:start(fillEffect)},
    {time:46.364 * 1000 - 1500 + 105 * 2,func:start(fillEffect)},
    {time:46.364 * 1000 - 1500 + 105 * 3,func:start(fillEffect)},
    {time:46.364 * 1000 - 1500 + 105 * 4,func:start(fillEffect)},

    {time:49.719 * 1000 - 1500 ,func:start(fillEffect)},
    {time:49.719 * 1000 - 1500 + 105,func:start(fillEffect)},
    
    {time:50.137 * 1000 - 1500 ,func:start(fillEffect)},
    {time:50.137 * 1000 - 1500 + 105,func:start(fillEffect)},

    {time:59.794 * 1000 - 1500 ,func:start(fillEffect)},
    {time:59.794 * 1000 - 1500 + 105,func:start(fillEffect)},
    {time:59.794 * 1000 - 1500 + 105 * 2,func:start(fillEffect)},
    {time:59.794 * 1000 - 1500 + 105 * 3,func:start(fillEffect)},
    {time:59.794 * 1000 - 1500 + 105 * 4,func:start(fillEffect)},
    {time:59.794 * 1000 - 1500 + 105 * 5,func:start(fillEffect)},

    {time:79.722 * 1000 - 1500,func:start(fillEffect)},
    {time:79.722 * 1000 - 1500 + 420,func:start(fillEffect)},

    {time:92.308 * 1000 - 1500 + 105 * 2,func:start(fillEffect)},
    {time:92.308 * 1000 - 1500 + 105 * 3,func:start(fillEffect)},
    {time:92.727 * 1000 - 1500 + 105 * 2,func:start(fillEffect)},
    {time:92.727 * 1000 - 1500 + 105 * 3,func:start(fillEffect)},
    {time:93.255 * 1000 - 1500 ,func:start(fillEffect)},
    {time:93.255 * 1000 - 1500 + 105,func:start(fillEffect)},
    {time:93.255 * 1000 - 1500 + 105 * 2,func:start(fillEffect)},
    {time:93.255 * 1000 - 1500 + 105 * 3,func:start(fillEffect)},
    {time:93.255 * 1000 - 1500 + 105 * 4,func:start(fillEffect)},
    {time:93.255 * 1000 - 1500 + 105 * 5,func:start(fillEffect)},

    {time:100.066 * 1000 - 1500 ,func:start(fillEffect)},
    {time:100.066 * 1000 - 1500 + 105,func:start(fillEffect)},
    {time:100.066 * 1000 - 1500 + 105 * 2,func:start(fillEffect)},
    {time:100.066 * 1000 - 1500 + 105 * 3,func:start(fillEffect)},
    {time:100.066 * 1000 - 1500 + 105 * 4,func:start(fillEffect)},

    {time:106.575 * 1000 - 1500,func:start(fillEffect)},
    {time:106.575 * 1000 - 1500 + 420,func:start(fillEffect)},

    {time:120.000 * 1000 - 1500,func:start(fillEffect)},
    {time:120.000 * 1000 - 1500 + 210,func:start(fillEffect)},
    {time:120.000 * 1000 - 1500 + 420,func:start(fillEffect)},
    {time:120.000 * 1000 - 1500 + 630,func:start(fillEffect)},

    {time:132.800 * 1000 - 1500 ,func:start(fillEffect)},
    {time:132.800 * 1000 - 1500 + 105,func:start(fillEffect)},
    {time:132.800 * 1000 - 1500 + 105 * 2,func:start(fillEffect)},
    {time:132.800 * 1000 - 1500 + 105 * 3,func:start(fillEffect)},
    {time:132.800 * 1000 - 1500 + 105 * 4,func:start(fillEffect)},

    {time:133.428 * 1000 - 1500 ,func:start(fillEffect)},
    {time:133.428 * 1000 - 1500 + 105,func:start(fillEffect)},
    {time:133.428 * 1000 - 1500 + 105 * 2,func:start(fillEffect)},
    {time:133.428 * 1000 - 1500 + 105 * 3,func:start(fillEffect)},
    {time:133.428 * 1000 - 1500 + 105 * 4,func:start(fillEffect)},
    {time:133.428 * 1000 - 1500 + 105 * 5,func:start(fillEffect)},
    {time:133.428 * 1000 - 1500 + 105 * 6,func:start(fillEffect)},
    
    {time:153.570 * 1000 - 1500,func:start(fillEffect)},
    {time:153.570 * 1000 - 1500 + 420,func:start(fillEffect)},

    {time:179.582 * 1000 - 1500 ,func:start(fillEffect)},
    {time:179.582 * 1000 - 1500 + 105,func:start(fillEffect)},
    {time:179.582 * 1000 - 1500 + 105 * 2,func:start(fillEffect)},

    {time:180.002 * 1000 - 1500 ,func:start(fillEffect)},
    {time:180.002 * 1000 - 1500 + 105,func:start(fillEffect)},
    {time:180.002 * 1000 - 1500 + 105 * 2,func:start(fillEffect)},

    {time:180.410 * 1000 - 1500 ,func:start(fillEffect)},
    {time:180.410 * 1000 - 1500 + 105,func:start(fillEffect)},
    {time:180.410 * 1000 - 1500 + 105 * 2,func:start(fillEffect)},
    {time:180.410 * 1000 - 1500 + 105 * 3,func:start(fillEffect)},
    {time:180.410 * 1000 - 1500 + 105 * 4,func:start(fillEffect)},
    {time:180.410 * 1000 - 1500 + 105 * 5,func:start(fillEffect)},
    {time:180.410 * 1000 - 1500 + 105 * 6,func:start(fillEffect)},

    {time:187.134 * 1000 - 1500,func:start(fillEffect)},
    {time:187.134 * 1000 - 1500 + 420,func:start(fillEffect)},

    {time:193.222 * 1000 - 1500 ,func:start(fillEffect)},
    {time:193.222 * 1000 - 1500 + 105,func:start(fillEffect)},
    {time:193.222 * 1000 - 1500 + 105 * 2,func:start(fillEffect)},
    {time:193.222 * 1000 - 1500 + 105 * 3,func:start(fillEffect)},
    {time:193.222 * 1000 - 1500 + 105 * 4,func:start(fillEffect)},

    {time:193.841 * 1000 - 1500 ,func:start(fillEffect)},
    {time:193.841 * 1000 - 1500 + 105,func:start(fillEffect)},
    {time:193.841 * 1000 - 1500 + 105 * 2,func:start(fillEffect)},
    {time:193.841 * 1000 - 1500 + 105 * 3,func:start(fillEffect)},
    {time:193.841 * 1000 - 1500 + 105 * 4,func:start(fillEffect)},
    {time:193.841 * 1000 - 1500 + 105 * 5,func:start(fillEffect)},
    {time:193.841 * 1000 - 1500 + 105 * 6,func:start(fillEffect)},

    {time:200.730 * 1000 - 1500 ,func:start(fillEffect)},
    {time:200.730 * 1000 - 1500 + 105,func:start(fillEffect)},
    {time:200.730 * 1000 - 1500 + 105 * 2,func:start(fillEffect)},
    {time:200.730 * 1000 - 1500 + 105 * 3,func:start(fillEffect)},
    {time:200.730 * 1000 - 1500 + 105 * 4,func:start(fillEffect)},
    
    {time:207.276 * 1000 - 1500 ,func:start(fillEffect)},
    {time:207.276 * 1000 - 1500 + 105,func:start(fillEffect)},
    {time:207.276 * 1000 - 1500 + 105 * 2,func:start(fillEffect)},

    {time:207.687 * 1000 - 1500 ,func:start(fillEffect)},
    {time:207.687 * 1000 - 1500 + 105,func:start(fillEffect)},
    {time:207.687 * 1000 - 1500 + 105 * 2,func:start(fillEffect)},

    {time:214.199 * 1000 - 1500 ,func:start(fillEffect)},
    {time:214.199 * 1000 - 1500 + 105,func:start(fillEffect)},

    {time:214.612 * 1000 - 1500 ,func:start(fillEffect)},
    {time:214.612 * 1000 - 1500 + 105,func:start(fillEffect)},

    {time:220.068 * 1000 - 1500 ,func:start(fillEffect)},
    {time:220.068 * 1000 - 1500 + 210,func:start(fillEffect)},
    {time:220.068 * 1000 - 1500 + 210 * 2,func:start(fillEffect)},
    {time:220.068 * 1000 - 1500 + 210 * 3,func:start(fillEffect)},
    {time:220.068 * 1000 - 1500 + 210 * 4,func:start(fillEffect)},
    {time:220.068 * 1000 - 1500 + 210 * 5,func:start(fillEffect)},
    {time:220.068 * 1000 - 1500 + 210 * 6,func:start(fillEffect)},

    {time:227.626 * 1000 - 1500 ,func:start(fillEffect)},
    {time:227.626 * 1000 - 1500 + 105,func:start(fillEffect)},
    {time:227.626 * 1000 - 1500 + 105 * 2,func:start(fillEffect)},
    {time:227.626 * 1000 - 1500 + 105 * 3,func:start(fillEffect)},
    {time:227.626 * 1000 - 1500 + 105 * 4,func:start(fillEffect)},

    {time:233.492 * 1000 - 1500 ,func:start(fillEffect)},
    {time:233.492 * 1000 - 1500 + 105,func:start(fillEffect)},

    {time:233.916 * 1000 - 1500 ,func:start(fillEffect)},
    {time:233.916 * 1000 - 1500 + 105,func:start(fillEffect)},

    {time:234.234 * 1000 - 1500 ,func:start(fillEffect)},
    {time:234.234 * 1000 - 1500 + 105,func:start(fillEffect)},
    {time:234.234 * 1000 - 1500 + 105 * 2,func:start(fillEffect)},
    {time:234.234 * 1000 - 1500 + 105 * 3,func:start(fillEffect)},
    {time:234.234 * 1000 - 1500 + 105 * 4,func:start(fillEffect)},
    {time:234.234 * 1000 - 1500 + 105 * 5,func:start(fillEffect)},

    // 間奏エフェクト
    {time:154.406 * 1000 - 1500,func:start(intEffect)}
    //{time:0,func:start(intEffect)}

  ];
  
  // 間奏エフェクト
  {
    let s = 161.119 * 1000 - 1500;
    for(let i = 0;i < 11;++i){
      let st = s + i * 420 * 4;
      events = events.concat([
        {time:st,func:start(intEffect2)},
        {time:st + 210,func:start(intEffect2)},
        {time:st + 420,func:start(intEffect2)},
        {time:st + 735,func:start(intEffect2)},
        {time:st + 945,func:start(intEffect2)},
        {time:st + 1155,func:start(intEffect2)},
        {time:st + 1260,func:start(intEffect2)},
        {time:st + 1470,func:start(intEffect2)},
      ]);
    }
  }


  var timeline = new TimeLine(events); 

  if(time != 0){
    timeline.skip(time);
  }

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
      Promise.all(writeFilePromises);
      window.close();
      return;
    }
    ++frameNo;

    // ctx.fillStyle = 'rgba(0,0,0,0.2)';
    // //ctx.fillRect(0,0,TEXW,TEXH);
    ctx.clearRect(0,0,TEXW,TEXH);
    let wsize = 1024;
    let pat = (((time * 1000 + 179) / 105) & 3 ) == 0;
    for(let i = 0;i < wsize;++i){
      let r = 0, l = 0;
      if((waveCount + i) < (chR.length)){
          r = chR[waveCount + i];
          l = chL[waveCount + i];
      }

      let hsll = 'hsl(' + Math.floor(Math.abs(r) * 200 + 250) + ',100%,50%)';
      let hslr = 'hsl(' + Math.floor(Math.abs(l) * 200 + 250) + ',100%,50%)';
      

      // if(pat){
      //   r = (r != 0 ? (r > 0 ? 1 : -1) : 0 ); 
      //   l = (l != 0 ? (l > 0 ? 1 : -1) : 0 ) ; 
      // }

      ctx.fillStyle = hsll;
      if(r>0){
        ctx.fillRect(TEXW/4 - r * TEXW / 4 - TEXW/wsize/2 ,i * TEXH/wsize,r * TEXW / 4,TEXH/wsize);
      } else {
        ctx.fillRect(TEXW/4 - TEXW/wsize/2 ,i * TEXH/wsize,-r * TEXW / 4,TEXH/wsize);
      }

      ctx.fillStyle = hslr;
      if(l>0){
        ctx.fillRect(TEXW/4 * 3 - l * TEXW / 4  - TEXW/wsize/2,i * TEXH/wsize,l * TEXW / 4,TEXH/wsize);
      } else {
        ctx.fillRect(TEXW/4 * 3 - TEXW/wsize/2 ,i * TEXH/wsize,-l * TEXW / 4,TEXH/wsize);
      }
    }

    fftmesh.position.x -= fftmeshSpeed;
  
    if(fftmesh.position.x < -4096)
      fftmesh.position.x = 0;

    fftmesh2.position.x -= fftmeshSpeed;
  
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

    // {
    //   let idx = parseInt(index,10);
    //   for (var i = 0, end = horseGroups.length; i < end; ++i) {
    //     var g = horseGroups[i];
    //     g.getObjectByName('horse' + ('00' + idx.toString(10)).slice(-2)).visible = true;
    //     if (idx == 0) {
    //       g.getObjectByName('horse10').visible = false;
    //     } else {
    //       g.getObjectByName('horse' + ('00' + (idx - 1).toString(10)).slice(-2)).visible = false;
    //     }
    //   } 
    // }

    waveCount += step;
    if(waveCount >= chR.length){
      Promise.all(writeFilePromises);
      window.close();
    }
    
    ffttexture.needsUpdate =true;
    ffttexture2.needsUpdate =true;

    camera.lookAt( camera.target );

    
    (frameNo & 1) && 
    mixers.forEach((mixer)=>{
      mixer.update(1 / fps * 2);
    });

    //renderer.render(scene, camera);
    composer.render(scene, camera);
    if(sfShaderPass.enabled && ((frameNo & 3) == 0)){
      sfShaderPass.uniforms.time.value += 0.105 * 4 * frameDelta;
    }
    let timeMs = time * 1000;
    timeline.update(timeMs);
    TWEEN.update(timeMs);
    if(preview){
      d3.select('#stat').text(time);
   }
   // console.log(time * 1000);

    if (!preview) {
      // canvasのtoDataURLを使用した実装
      

      
      //var data = d3.select('#console').node().toDataURL('image/png');
      //var img  = nativeImage.createFromDataURL(data);
      //data = data.substr(data.indexOf(',') + 1);
      //var buffer = new Buffer(data, 'base64');
      //renderer.readRenderTargetPixels()
      // var data = d3.select('#console').node().toDataURL('image/jpeg');
      // var img  = nativeImage.createFromDataURL(data);
      // writeFilePromises.push(writeFile('./temp/out' + ('000000' + frameNo.toString(10)).slice(-6) + '.jpeg',img.toJPEG(80),'binary'));
      writeFilePromises.push(saveImage(new Buffer(sfCapturePass.buffers[sfCapturePass.currentIndex].buffer),'./temp/out' + ('000000' + frameNo.toString(10)).slice(-6) + '.jpeg',WIDTH,HEIGHT));
      let p = Promise.resolve(0);
      if(writeFilePromises.length > 50)
      {
        p = Promise.all(writeFilePromises)
        .then(()=>{
          writeFilePromises.length = 0;
        });
      }
      // saveImage(new Buffer(sfCapturePass.buffer.buffer),'./temp/out' + ('000000' + frameNo.toString(10)).slice(-6) + '.png',WIDTH,HEIGHT)
      p.then(renderToFile.bind(this,preview))
      .catch(function(e){
        console.log(err);
      });
    } else {
      // プレビュー
      requestAnimationFrame(renderToFile.bind(null, preview));
      //renderer.render(scene, camera);
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


  function generateSprite() {
    var canvas = document.createElement( 'canvas' );
    canvas.width = 16;
    canvas.height = 16;
    var context = canvas.getContext( '2d' );
    var gradient = context.createRadialGradient( canvas.width / 2, canvas.height / 2, 0, canvas.width / 2, canvas.height / 2, canvas.width / 2 );
    gradient.addColorStop( 0, 'rgba(255,255,255,1)' );
    gradient.addColorStop( 0.2, 'rgba(0,255,255,1)' );
    gradient.addColorStop( 0.4, 'rgba(0,0,64,1)' );
    gradient.addColorStop( 1, 'rgba(0,0,0,1)' );
    context.clearRect(0,0,canvas.width, canvas.height)
    context.fillStyle = gradient;
    context.fillRect( 0, 0, canvas.width, canvas.height );
    return canvas;
  }

  function initParticle( particle, delay ) {
    let hsl = 'hsl(' + Math.floor(Math.abs(r) * 200 + 250) + ',100%,50%)';

    var particle = this instanceof THREE.Sprite ? this : particle;
    var delay = delay !== undefined ? delay : 0;
    particle.position.set( Math.random() * 500 - 250, Math.random() * 500 - 250, -4000 );
    particle.scale.x = particle.scale.y = Math.random() * 500 + 50;

    new TWEEN.Tween( particle )
      .delay( delay )
      .to( {}, 5000 )
      .onComplete( initParticle )
      .onStart(function(){        particle.visible = true;
      })
      .start(parseInt(time * 1000));
    
    new TWEEN.Tween( particle.position )
      .delay( delay )
      .to( { x: Math.random() * 500 - 250, y: Math.random() * 500 - 250, z: Math.random() * 1000 + 500 }, 10000 )
      .to( { z: Math.random() * 1000 + 500 }, 5000 )
      .start(parseInt(time * 1000));
    
    new TWEEN.Tween( particle.scale )
      .delay( delay )
      .to( { x: 0.01, y: 0.01 }, 5000 )
      .start(parseInt(time * 1000));
  }
});


