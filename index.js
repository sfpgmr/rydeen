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

var fps = 30;

var fs = require('fs');
var sf = require('./pathSerializer');
var denodeify = require('./denodeify'); 
var TWEEN = require('tween.js');
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
  ffttexture.needsUpdate = true;
  var fftgeometry = new THREE.PlaneBufferGeometry(8192,8192,16,16);
  var fftmaterial = new THREE.MeshBasicMaterial({map:ffttexture,transparent:true,overdraw:true,opacity:1.0,side:THREE.DoubleSide});
  var fftmesh = new THREE.Mesh(fftgeometry,fftmaterial);

  ffttexture.wrapS = THREE.RepeatWrapping;
  ffttexture.wrapT = THREE.RepeatWrapping;
  ffttexture.repeat.set( 8, 4 );

  fftmesh.position.z = 0.0;
  fftmesh.rotation.x = Math.PI / 2;

  var fftmesh2 = fftmesh.clone();
  fftmesh2.position.x += 8192;

  scene.add(fftmesh);
  scene.add(fftmesh2);

  var wgeometry = new THREE.CylinderGeometry(512,512,32768,32,32,true);
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
  var fftsize = 256;
  var fft = new FFT(fftsize, 48000);
  var waveCount = 0;
  var index = 0;
  time = 0.0;
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
  var fftmeshSpeed = 50 * 30 / fps;

  var horseFadein1 = new TWEEN.Tween({opacity:0});
  horseFadein1.to({opacity:1.0},5000);
  horseFadein1.delay(60420 - 1500);
  horseFadein1.onUpdate(function(){
      console.log(time,this.opacity);
      meshes.forEach((d)=>{
        d.material.opacity = this.opacity;
      });
  });

  horseFadein1.onStart(()=>{
    console.log('start');
    horseGroup.visible = true;
  });

  var horseFadeOut1 = new TWEEN.Tween({opacity:1.0});
  horseFadeOut1.to({opacity:0.0},3000);
  horseFadeOut1.delay(20140 - 5000 - 3000);
  horseFadeOut1.onUpdate(function(){
      console.log(time,this.opacity);
      meshes.forEach((d)=>{
        d.material.opacity = this.opacity;
      });
  });
  horseFadeOut1.onComplete(()=>{
    horseGroup.visible = false;
  });

  var horseFadein2 = new TWEEN.Tween({opacity:0});
  horseFadein2.to({opacity:1.0},5000);
  horseFadein2.delay(134266 - 1500);
  horseFadein2.onStart(()=>{
    horseGroup.visible = true;
  });
  horseFadein2.onUpdate(function(){
      meshes.forEach((d)=>{
        d.material.opacity = this.opacity;
      });
  });


  var horseFadeOut2 = new TWEEN.Tween({opacity:1.0});
  horseFadeOut2.to({opacity:0.0},3000);
  horseFadeOut2.delay(20140 - 5000 - 3000);
  horseFadeOut2.onComplete(()=>{
    horseGroup.visible = false;
  });

  horseFadeOut2.onUpdate(function(){
      meshes.forEach((d)=>{
        d.material.opacity = this.opacity;
      });
  });
  
  
  horseFadein1.chain(horseFadeOut1);
  horseFadein2.chain(horseFadeOut2);
  horseFadein1.start(0);
  horseFadein2.start(0);


  var rotateCilynder = new TWEEN.Tween({time:0});
  var ry = 0;
  rotateCilynder
  .to({time:endTime},1000 * endTime)
  .onUpdate(function(){
    //camera.position.x = radius * Math.sin( theta );
    //camera.rotation.z += 0.1;//radius * Math.cos( theta );
    //wmesh.rotation.x += 0.01;
    wmesh.geometry.rotateY(0.05);
    //theta += 0.01 * 30 / fps;
	  ry += 0.001;
    camera.lookAt( camera.target );
  });

  rotateCilynder.start(0);

  var cameraTween = new TWEEN.Tween({x:0,y:0,z:1000,opacity:1.0});
  cameraTween.to({x:0,z:radius,y:2000,opacity:0.0},1000);
  cameraTween.delay(20.140 * 1000 - 1500);
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
  cameraTween11.to({theta:-4 * Math.PI},11587);
  cameraTween11.onUpdate(function(){
    camera.position.x = Math.sin(this.theta) * radius;
    camera.position.z = Math.cos(this.theta) * radius;
  });
  cameraTween.chain(cameraTween11);


  var cameraTween2 = new TWEEN.Tween({x:0,y:2000,z:1000,opacity:0.0});
  cameraTween2.to({x:0,y:0,opacity:1.0},1000);
  cameraTween2.delay(32.727 * 1000 - 1500);
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

  var cameraTween3 = new TWEEN.Tween({x:0,y:0,z:1000,opacity:1.0});
  cameraTween3.to({x:0,z:radius,y:2000,opacity:0.0},1000);
  cameraTween3.delay(46.993 * 1000 - 1500);
  cameraTween3.onUpdate(function(){
    fftmesh.material.opacity = 1.0 - this.opacity;
    fftmesh2.material.opacity = 1.0 - this.opacity;
    wmesh.material.opacity = this.opacity;
    camera.position.x = this.x;
    camera.position.y = this.y;
  });
  cameraTween3.onStart(function(){
    fftmesh.visible = true;
    fftmesh2.visible = true;
  });
  cameraTween3.onComplete(function(){
    wmesh.visible = false;
  });
  var cameraTween31 = new TWEEN.Tween({theta:0});
  cameraTween31.to({theta:4 * Math.PI},11587);
  cameraTween31.onUpdate(function(){
    camera.position.x = Math.sin(this.theta) * radius;
    camera.position.z = Math.cos(this.theta) * radius;
  });
  cameraTween3.chain(cameraTween31);
  
  

  var cameraTween4 = new TWEEN.Tween({x:0,y:2000,z:1000,opacity:1.0});
  cameraTween4.to({x:0,y:1000,z:1000},1000);
  cameraTween4.delay(60.420 * 1000 - 1500);
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



  var cameraTween5 = new TWEEN.Tween({x:0,y:1000,z:500,opacity:0.0});
  cameraTween5.to({x:0,y:0,opacity:1.0},1000);
  cameraTween5.delay(79.720 * 1000 - 1500);
  cameraTween5.onUpdate(function(){
    fftmesh.material.opacity = 1.0 - this.opacity;
    fftmesh2.material.opacity = 1.0 - this.opacity;
    wmesh.material.opacity = this.opacity;
    camera.position.x = this.x;
    camera.position.y = this.y;
  });
  cameraTween5.onStart(function(){
    wmesh.visible = true;
  });
  cameraTween5.onComplete(function(){
    fftmesh.visible = false;
    fftmesh2.visible = false;
  });

  var cameraTween6 = new TWEEN.Tween({x:0,y:0,z:1000,opacity:1.0});
  cameraTween6.to({x:0,y:2000,opacity:0.0},1000);
  cameraTween6.delay(93.986 * 1000 - 1500);
  cameraTween6.onUpdate(function(){
    fftmesh.material.opacity = 1.0 - this.opacity;
    fftmesh2.material.opacity = 1.0 - this.opacity;
    wmesh.material.opacity = this.opacity;
    camera.position.x = this.x;
    camera.position.y = this.y;
  });
  cameraTween6.onStart(function(){
    fftmesh.visible = true;
    fftmesh2.visible = true;
  });
  cameraTween6.onComplete(function(){
    wmesh.visible = false;
  });  
  var cameraTween61 = new TWEEN.Tween({theta:0});
  cameraTween61.to({theta:-4 * Math.PI},11587);
  cameraTween61.onUpdate(function(){
    camera.position.x = Math.sin(this.theta) * radius;
    camera.position.z = Math.cos(this.theta) * radius;
    
  });
  cameraTween6.chain(cameraTween61);


  var cameraTween7 = new TWEEN.Tween({x:0,y:2000,z:1000,opacity:0.0});
  cameraTween7.to({x:0,y:0,opacity:1.0},1000);
  cameraTween7.delay(106.573 * 1000 - 1500);
  cameraTween7.onUpdate(function(){
    fftmesh.material.opacity = 1.0 - this.opacity;
    fftmesh2.material.opacity = 1.0 - this.opacity;
    wmesh.material.opacity = this.opacity;
    camera.position.x = this.x;
    camera.position.y = this.y;
  });
  cameraTween7.onStart(function(){
    wmesh.visible = true;
  });
  cameraTween7.onComplete(function(){
    fftmesh.visible = false;
    fftmesh2.visible = false;
  });



  var cameraTween8 = new TWEEN.Tween({x:0,y:0,z:1000,opacity:1.0});
  cameraTween8.to({x:0,y:2000,opacity:0.0},1000);
  cameraTween8.delay(120.839 * 1000 - 1500);
  cameraTween8.onUpdate(function(){
    fftmesh.material.opacity = 1.0 - this.opacity;
    fftmesh2.material.opacity = 1.0 - this.opacity;
    wmesh.material.opacity = this.opacity;
    camera.position.x = this.x;
    camera.position.y = this.y;
  });
  cameraTween8.onStart(function(){
    fftmesh.visible = true;
    fftmesh2.visible = true;
  });
  cameraTween8.onComplete(function(){
    wmesh.visible = false;
  });
  var cameraTween81 = new TWEEN.Tween({theta:0});
  cameraTween81.to({theta:4 * Math.PI},11587);
  cameraTween81.onUpdate(function(){
    camera.position.x = Math.sin(this.theta) * radius;
    camera.position.z = Math.cos(this.theta) * radius;
  });
  cameraTween8.chain(cameraTween81);
  

  var cameraTween9 = new TWEEN.Tween({x:0,y:2000,z:1000,opacity:1.0});
  cameraTween9.to({x:0,y:1000,z:1000},1000);
  cameraTween9.delay(133.427 * 1000 - 1500);
  cameraTween9.onUpdate(function(){
    camera.position.x = this.x;
    camera.position.y = this.y;
  });
  var cameraTween91 = new TWEEN.Tween({theta:0});
  cameraTween91.to({theta:2 * Math.PI},18300);
  cameraTween91.onUpdate(function(){
    camera.position.x = Math.sin(this.theta) * radius;
    camera.position.z = Math.cos(this.theta) * radius;
  });
  cameraTween9.chain(cameraTween91);



  var cameraTween10 = new TWEEN.Tween({x:0,y:1000,z:500,opacity:0.0});
  cameraTween10.to({x:0,y:0,opacity:1.0},1000);
  cameraTween10.delay(180.420 * 1000 - 1500);
  cameraTween10.onUpdate(function(){
    fftmesh.material.opacity = 1.0 - this.opacity;
    fftmesh2.material.opacity = 1.0 - this.opacity;
    wmesh.material.opacity = this.opacity;
    camera.position.x = this.x;
    camera.position.y = this.y;
  });
  cameraTween10.onStart(function(){
    wmesh.visible = true;
  });
  cameraTween10.onComplete(function(){
    fftmesh.visible = false;
    fftmesh2.visible = false;
  });  


  cameraTween.start(0);
  cameraTween2.start(0);
  cameraTween3.start(0);
  cameraTween4.start(0);
  cameraTween5.start(0);
  cameraTween6.start(0);
  cameraTween7.start(0);
  cameraTween8.start(0);
  cameraTween9.start(0);
  cameraTween10.start(0);

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


  // Shader Sampleより拝借
  // https://github.com/mrdoob/three.js/blob/master/examples/webgl_shader.html

//   {
//   let vertShader = `
// void main()	{
//       gl_Position = vec4( position, 1.0 );
//     }
//   `;
//   let fragShader = `
// 			uniform vec2 resolution;
// 			uniform float time;
// 			void main()	{
// 				vec2 p = -1.0 + 2.0 * gl_FragCoord.xy / resolution.xy;
// 				float a = time*40.0;
// 				float d,e,f,g=1.0/40.0,h,i,r,q;
// 				e=400.0*(p.x*0.5+0.5);
// 				f=400.0*(p.y*0.5+0.5);
// 				i=200.0+sin(e*g+a/150.0)*20.0;
// 				d=200.0+cos(f*g/2.0)*18.0+cos(e*g)*7.0;
// 				r=sqrt(pow(abs(i-e),2.0)+pow(abs(d-f),2.0));
// 				q=f/r;
// 				e=(r*cos(q))-a/2.0;f=(r*sin(q))-a/2.0;
// 				d=sin(e*g)*176.0+sin(e*g)*164.0+r;
// 				h=((f+d)+a/2.0)*g;
// 				i=cos(h+r*p.x/1.3)*(e+e+a)+cos(q*g*6.0)*(r+h/3.0);
// 				h=sin(f*g)*144.0-sin(e*g)*212.0*p.x;
// 				h=(h+(f-e)*q+sin(r-(a+h)/7.0)*10.0+i/4.0)*g;
// 				i+=cos(h*2.3*sin(a/350.0-q))*184.0*sin(q-(r*4.3+a/12.0)*g)+tan(r*g+h)*184.0*cos(r*g+h);
// 				i=mod(i/5.6,256.0)/64.0;
// 				if(i<0.0) i+=4.0;
// 				if(i>=2.0) i=4.0-i;
// 				d=r/350.0;
// 				d+=sin(d*d*8.0)*0.52;
// 				f=(sin(a*g)+1.0)/2.0;
// 				gl_FragColor=vec4(vec3(f*i/1.6,i/2.0+d/13.0,i)*d*p.x+vec3(i/1.3+d/8.0,i/2.0+d/18.0,i)*d*(1.0-p.x),1.0);
// 			}
//   `;
//     let geometry = new THREE.PlaneBufferGeometry( 1, 1 );
//     uniforms = {
//       time:       { value: 1.0 },
//       resolution: { value: new THREE.Vector2() }
//     };
//     uniforms.resolution.value.x = WIDTH;
//     uniforms.resolution.value.y = HEIGHT;
//     let material = new THREE.ShaderMaterial( {
//       uniforms: uniforms,
//       vertexShader: vertShader,
//       fragmentShader: fragShader
//     } );
//     let mesh = new THREE.Mesh( geometry, material );
//     mesh.position.z = -5000;
//     scene.add( mesh );
//   }

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
    //ctx.fillRect(0,0,TEXW,TEXH);
    ctx.clearRect(0,0,TEXW,TEXH);
    let wsize = 1024;

    for(let i = 0;i < wsize;++i){
      let r = 0, l = 0;
      if((waveCount + i) < (chR.length)){
          r = chR[waveCount + i];
          l = chL[waveCount + i];
      }

      let hsl = 'hsl(' + Math.floor(Math.abs(r) * 200 + 250) + ',100%,50%)';
      ctx.fillStyle = hsl;
      if(r>0){
        ctx.fillRect(TEXW/4 - r * TEXW / 4 - TEXW/wsize/2 ,i * TEXH/wsize,r * TEXW / 4,TEXH/wsize);
      } else {
        ctx.fillRect(TEXW/4 - TEXW/wsize/2 ,i * TEXH/wsize,-r * TEXW / 4,TEXH/wsize);
      }

      hsl = 'hsl(' + Math.floor(Math.abs(l) * 200 + 250) + ',100%,50%)';
      ctx.fillStyle = hsl;
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
      window.close();
    }
    
    ffttexture.needsUpdate =true;

    camera.lookAt( camera.target );

    mixers.forEach((mixer)=>{
      mixer.update(1 / fps);
    });

    renderer.render(scene, camera);
    //uniforms.time.value += 0.05;
    TWEEN.update(parseInt(time * 1000));
    if(preview){
      d3.select('#stat').text(time);
   }
   // console.log(time * 1000);

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
       //let hsl = 'hsl(' + Math.floor(Math.abs(r) * 200 + 250) + ',100%,50%)';

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
//					.to( { x: Math.random() * 500 - 250, y: Math.random() * 500 - 250, z: Math.random() * 1000 + 500 }, 10000 )
					.to( { z: Math.random() * 1000 + 500 }, 5000 )
					.start(parseInt(time * 1000));
				
        new TWEEN.Tween( particle.scale )
					.delay( delay )
					.to( { x: 0.01, y: 0.01 }, 5000 )
					.start(parseInt(time * 1000));

			}
});


