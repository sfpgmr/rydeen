"use strict";
import electron from 'electron';
import fs from "fs";
import child_process from 'child_process';
import util from 'util';
import { DH_CHECK_P_NOT_SAFE_PRIME } from 'constants';

//const spawn = util.promisify(child_process.spawn);
// Module to control application life.
const app = electron.app;
// Module to create native browser window.
const BrowserWindow = electron.BrowserWindow


// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow;
const fsp = fs.promises;

async function createWindow() {

  var preview = false;
  var configPath = "./rydeen.json";
  let generate = false;
  process.argv.forEach((arg, i) => {
    if (arg == '-configPath') {
      configPath = process.argv[i + 1];
    }
    if (arg == '-preview') {
      preview = process.argv[i + 1];
    }
    if (arg == '-generate') {
      generate = parseInt(process.argv[i + 1], 10) == 1;
    }
  });


  const config = JSON.parse(await fsp.readFile(configPath, 'utf-8'));
  console.log(generate);
  config.preview = preview;
  config.generate = generate;

  if (generate) {
    // Create the browser window.
    mainWindow = new BrowserWindow({
      width: 1920, height: 1080,
      useContentSize: true,
      resizable: false,
      webPreferences: {
        nodeIntegration: true
      }
    });
    //mainWindow.webContents.openDevTools()

    // and load the index.html of the app.
    mainWindow.loadURL(`file://${__dirname}/index.html?preview=${preview}`);
    mainWindow.webContents.openDevTools('undocked');
    mainWindow.webContents.on('did-finish-load', () => {
      mainWindow.webContents.send('render', config);
    });

    // Open the DevTools.
    //mainWindow.webContents.openDevTools('undocked');

    // Emitted when the window is closed.
    mainWindow.on('closed', async () => {
      // Dereference the window object, usually you would store windows
      // in an array if your app supports multi windows, this is the time
      // when you should delete the corresponding element.
      mainWindow = null;
      await new Promise((resolve, reject) => {
        console.log('ffmpeg');
        const ffmpeg = child_process.spawn("ffmpeg", ["-framerate", config.framerate, "-i", "./temp/out%%06d.jpg", "-i", config.mainDataFile, "-filter_complex", `"[0:v]drawtext=fontfile=./media/'YuGothic-Bold.ttf':fontcolor=white:x=30:y=30:fontsize=32: box=1: boxcolor=black@0.5:boxborderw=5:text='YMO - ${config.songName} (${config.ver}) performed by SFPG',fade=t=out:st=213:d=4[out]"`, "-map", `"[out]":v`, "-map", "1:a", "-t", config.songLengthSec, "-s", "1920x1080", "-aspect", "16:9", "-pix_fmt", "yuv420p", "-c:v", "h264_nvenc", "-b:a", "6000k", "-r:a", "96000", "-b:v", "30M", "-minrate", "30M", "-maxrate", "30M", "-qmin", "1", "-qmax", "20", "-movflags", "faststart", config.outputPath, "-y"]);

        ffmpeg.stdout.on('data', (data) => {
          console.log(`stdout: ${data}`);
        });

        ffmpeg.stderr.on('data', (data) => {
          reject(`stderr: ${data}`);
        });

        ffmpeg.on('close', (code) => {
          resolve(`ffmpeg end . ${code}`)
        });

      });
    });

  } else {
    try {
    await new Promise((resolve, reject) => {
      const ffmpeg = child_process.spawn("ffmpeg", ["-framerate", config.framerate, "-i", "./temp/out%%06d.jpg", "-i", config.mainDataFile, "-filter_complex", `"[0:v]drawtext=fontfile=./media/'YuGothic-Bold.ttf':fontcolor=white:x=30:y=30:fontsize=32: box=1: boxcolor=black@0.5:boxborderw=5:text='YMO - ${config.songName} (${config.ver}) performed by SFPG',fade=t=out:st=213:d=4[out]"`, "-map", `"[out]":v`, "-map", "1:a", "-t", config.songLengthSec, "-s", "1920x1080", "-aspect", "16:9", "-pix_fmt", "yuv420p", "-c:v", "h264_nvenc", "-b:a", "6000k", "-r:a", "96000", "-b:v", "30M", "-minrate", "30M", "-maxrate", "30M", "-qmin", "1", "-qmax", "20", "-movflags", "faststart", config.outputPath, "-y"]);

      ffmpeg.stdout.on('data', (data) => {
        console.log(`stdout: ${data}`);
      });

      ffmpeg.stderr.on('data', (data) => {
        console.log(data.toString());
        reject(`stderr: ${data}`);
      });

      ffmpeg.on('close', (code) => {
        resolve(`ffmpeg end . ${code}`)
      });

    });
  } catch (e) {
    console.log(e);
    process.abort();
  }
  }
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow)

// Quit when all windows are closed.
app.on('window-all-closed', function () {
  // On OS X it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', function () {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (mainWindow === null) {
    createWindow()
  }
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
