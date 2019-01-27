(()=>{
'use strict';
const fs = require('fs');
const gulp = require('gulp');
const logger = require('gulp-logger');
const watch = require('gulp-watch');
const source = require('vinyl-source-stream');
const plumber = require('gulp-plumber');

const browserSync =require('browser-sync');

const postcss = require('gulp-postcss');
const autoprefixer = require('autoprefixer');
const atImport = require('postcss-import');

const rollup = require('rollup').rollup;
const commonjs = require('rollup-plugin-commonjs');
const nodeResolve = require('rollup-plugin-node-resolve');


// JSのビルド
gulp.task('electron_js', (done)=>{
  const tasks = [];
  
  tasks.push(rollup({
    entry: 'src/js/electron/index.js',
    plugins: [
      nodeResolve({ jsnext: true }),
      commonjs()
    ],
    external:[
      'sharp','electron','events','tween',
    ]
  }).then((bundle)=>{
    bundle.write({
      format: 'cjs',
      dest: 'dist/electron/index.js'
    });
  }));

  tasks.push(rollup({
    entry: 'src/js/electron/main.js',
    plugins: [
      nodeResolve({ jsnext: true }),
      commonjs()
    ],
    external:[
      'sharp','electron','events','tween'
    ]
  }).then((bundle)=> {
    bundle.write({
      format: 'cjs',
      dest: 'dist/electron/main.js'
    });
  }));

  Promise.all(tasks)
  .then(()=>{
//  gulp.src('./src/js/GlitchPass.js').pipe(gulp.dest('./dist/electron'));
    gulp.src('./src/js/dsp.js').pipe(gulp.dest('./dist/electron'));
    done();
  });

//  gulp.src('./src/js/GlitchPass.js').pipe(gulp.dest('./dist/electron'));
//  gulp.src('./src/js/dsp.js').pipe(gulp.dest('./dist/electron'));
  //gulp.src('./src/js/AudioAnalyser.js').pipe(gulp.dest('./dist/electron'));
});

gulp.task('browser_js',(done)=>{
  rollup({
    entry: 'src/js/browser/index.js',
    plugins: [
      nodeResolve({ jsnext: true }),
      commonjs()
    ],
    external:[
      'sharp','electron','events'
    ]
  }).then((bundle)=>{
    bundle.write({
      format: 'iife',
      dest: 'dist/browser/index.js'
    });
    gulp.src('./src/js/dsp.js').pipe(gulp.dest('./dist/browser'));
    done();
  });
});

gulp.task('res',(done)=>{
  gulp.src('./horse.json')
    .pipe(gulp.dest('./dist/electron'))
    .pipe(gulp.dest('./dist/browser'));
    done();
})
// gulp.task('js',function(){
//     browserify('./src/js/main.js',{debug:true,extensions: ['.js']})
//     .transform(babelify,{"plugins": [
//       "transform-es2015-arrow-functions",
//       "transform-es2015-block-scoped-functions",
//       "transform-es2015-block-scoping",
//       "transform-es2015-classes",
//       "transform-es2015-computed-properties",
// //      "transform-es2015-constants",
//       "transform-es2015-destructuring",
//       "transform-es2015-for-of",
//       "transform-es2015-function-name",
//       "transform-es2015-literals",
//       "transform-es2015-modules-commonjs",
//       "transform-es2015-object-super",
//       "transform-es2015-parameters",
//       "transform-es2015-shorthand-properties",
//       "transform-es2015-spread",
//       "transform-es2015-sticky-regex",
//       "transform-es2015-template-literals",
//       "transform-es2015-typeof-symbol",
//       "transform-es2015-unicode-regex"
//       ]})
// //    .transform({global:true},uglifyify)
//     .bundle()
//     .on("error", function (err) { console.log("Error : " + err.message); })
//     .pipe(source('bundle.js'))
//     .pipe(gulp.dest('./dist/js'));

//     try {
//       fs.accessSync('./dist/js/dsp.js');
//     } catch (e) {
//       if(e.code == 'ENOENT'){
//         gulp.src('./src/js/dsp.js').pipe(gulp.dest('./dist/js'));
//       }
//     }
// });

// gulp.task('devjs',function(){
//     browserify('./src/app/js/devMain.js',{debug:true,extensions: ['.js'],detectGlobals: false,
//     builtins: []})
//     .transform(babelify,{"plugins": [
//       "transform-es2015-arrow-functions",
//       "transform-es2015-block-scoped-functions",
//       "transform-es2015-block-scoping",
//       "transform-es2015-classes",
//       "transform-es2015-computed-properties",
// //      "transform-es2015-constants",
//       "transform-es2015-destructuring",
//       "transform-es2015-for-of",
//       "transform-es2015-function-name",
//       "transform-es2015-literals",
//       "transform-es2015-modules-commonjs",
//       "transform-es2015-object-super",
//       "transform-es2015-parameters",
//       "transform-es2015-shorthand-properties",
//       "transform-es2015-spread",
//       "transform-es2015-sticky-regex",
//       "transform-es2015-template-literals",
//       "transform-es2015-typeof-symbol",
//       "transform-es2015-unicode-regex"
//       ]})
// //    .transform({global:true},uglifyify)
//     .bundle()
//     .on("error", function (err) { console.log("Error : " + err.message); })
//     .pipe(source('bundle.js'))
//     .pipe(gulp.dest('./dist/app/js'));
//     try {
//       fs.accessSync('./dist/app/js/dsp.js');
//     } catch (e) {
//       if(e.code == 'ENOENT'){
//         gulp.src('./src/js/dsp.js').pipe(gulp.dest('./dist/app/js'));
//       }
//     }

// });


// CSSのビルド
// gulp.task('postcss', function() {
//     gulp.src('./src/css/**/*.css')
//         .pipe(plumber())
//         .pipe(postcss([
//             atImport(),
//             require('postcss-mixins')(),
//             require('postcss-nested')(),
//             require('postcss-simple-vars')(),
//             require('cssnext')(),
// //            require('cssnano')(),
//             autoprefixer({ browsers: ['last 2 versions'] })
//         ]))
//         .pipe(gulp.dest('./dist/css'))
//         .pipe(gulp.dest('./dist/app/css'))
//         .pipe(logger({ beforeEach: '[postcss] wrote: ' }));
// });

//HTMLのコピー
gulp.task('html',(done)=>{
  gulp.src('./src/html/electron/*.html').pipe(gulp.dest('./dist/electron'));
  gulp.src('./src/html/browser/*.html').pipe(gulp.dest('./dist/browser'));
  done();
});

// gulp.task('devhtml',function(){
//   gulp.src('./src/app/html/*.html').pipe(gulp.dest('./dist/app'));
// });

// //リソースのコピー
// gulp.task('res',function(){
//   gulp.src('./src/res/*.json').pipe(gulp.dest('./dist/res'));
//   gulp.src('./src/res/*.json').pipe(gulp.dest('./dist/app/res'));
// });

// devverディレクトリへのコピー
gulp.task('snap',(done)=>{
  var date = new Date();
  var destdir = './dist/browser/' + date.getUTCFullYear() + ('0' + (date.getMonth() + 1)).slice(-2)  + ('0' + date.getDate()).slice(-2);
  
  try {
    fs.mkdirSync(destdir);
  } catch (e){
    
  }
  gulp.src('./dist/browser/*.*').pipe(gulp.dest(destdir));
  done();
});

gulp.task('browser-sync', (done)=> {
    browserSync({
        server: {
             baseDir: "./dist/browser/"
            ,index  : "index.html"
        },
        files:['./dist/browser/**/*.*']
    });
    done();
});

gulp.task('bs-reload', (done)=> {
    browserSync.reload();
    done();
});

// gulp.task('devapp',()=>{
//   try {
//     fs.mkdirSync('./dist/app');
//   } catch (e) {
//   }
//   gulp.src('./src/app/*.js').pipe(gulp.dest('./dist/app'));
// });

gulp.task('default',gulp.series('html','electron_js','browser_js','res'/*,'browser-sync','devhtml','devjs','res','postcss','devapp','browser-sync'*/,(done)=>{
    watch('./src/js/*.js',()=>gulp.start(['electron_js','browser_js']));
    watch('./src/js/electron/*.js',()=>gulp.start(['electron_js']));
    watch('./src/js/browser/*.js',()=>gulp.start(['browser_js']));
    watch('./src/html/**/*.html',()=>gulp.start(['html']));
    // watch('./src/res/**/*.json',()=>gulp.start(['res']));
    // watch('./src/css/**/*.css',()=>gulp.start(['postcss']));
    // watch('./dist/**/*.*',()=>gulp.start(['bs-reload']));
    // watch('./src/app/js/*.js',()=>gulp.start(['devjs']));
    // watch('./src/app/*.js',()=>gulp.start(['devapp']));
    // watch('./src/app/html/*.html',()=>gulp.start(['devhtml']));
    done();
}));
})();