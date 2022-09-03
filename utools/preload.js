/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
const process = require('process');
const os = require('os');
const { extname, basename, dirname, join, sep } = require('path');
const zlib = require('zlib');
const fs = require('fs');
const {
  writeFileSync,
  readdirSync,
  readFileSync,
  rmdirSync,
  rmSync,
  copySync,
  renameSync,
} = require('fs-extra');
const { remote } = require('electron');
const { execSync } = require('child_process');
const pkg = require('./plugin.json');
const Asar = require('./libs/asar/asar');

window.Path = { extname, basename, dirname, join, sep };
window.readFileSync = readFileSync;
window.writeFileSync = writeFileSync;
window.rmdirSync = rmdirSync;
window.rmSync = rmSync;
window.Asar = Asar;

window.UPluginPath = join(utools.getPath('userData'), 'plugins');

window.cpSync = (src, dest) =>
  copySync(src, dest, {
    recursive: true,
  });

/** 列出 utools 所有插件 */
window.getUtoolsPlugins = () => {
  const tempArr = [];
  const list = readdirSync(UPluginPath).filter((filepath) => extname(filepath) === '.asar');
  list.forEach((file) => {
    const fullPath = join(UPluginPath, file);
    const arr = JSON.parse(readFileSync(fullPath + '/plugin.json', 'UTF-8'));
    arr.fileName = file;
    arr.fullPath = fullPath;
    tempArr.push(arr);
  });
  // console.log(tempArr, utools.getPath('userData'));
  return tempArr;
};

window.UPluginFiles = getUtoolsPlugins();

/**
 * @description Unpack asar file from upx
 */
function upxUnPack(upxFile) {
  const sourcePath = upxFile;
  const filePath = join(__dirname, basename(upxFile, '.upx'));
  const unzip = zlib.createGunzip();
  const ws = fs.createWriteStream(filePath);
  fs.createReadStream(sourcePath)
    .pipe(unzip)
    .pipe(ws)
    .on('finish', (e) => {
      console.log('upxUnPack finish', e);
    });
}

window.getUpxAsarPath = function (upxPath) {
  return new Promise((resolve, reject) => {
    // console.log('upxPath', upxUnPack(upxPath));
    let asar_path = join(window.utools.getPath('temp'), 'temp-asarer' + Date.now());

    const stream = fs.createReadStream(upxPath),
      writer = fs.createWriteStream(asar_path),
      unzip = zlib.createGunzip();

    stream
      .pipe(unzip)
      .on('error', () => {
        console.log('安装包解压错误');
        reject(new Error('安装包解压错误'));
      })
      .pipe(writer)
      .on('error', (e) => {
        console.log('解压写入错误', e);
        reject(new Error('解压写入错误'));
      })
      .on('finish', () => {
        asar_path = (renameSync(asar_path, asar_path + '.asar'), asar_path + '.asar');
        // mv asar_path asar_path+ '.asar'

        resolve(asar_path);
      });
  });
};

window.showAboutDialog = () => {
  const isSnap = process.platform === 'linux' && process.env.SNAP && process.env.SNAP_REVISION;

  let detail = '';
  let commit = 'Unknown';
  let date = 'Unknown';

  if (process.env.NODE_ENV === 'production') {
    commit = pkg._commit || 'Unknown';
    date = pkg._commitDate || 'Unknown';
  } else {
    try {
      commit = execSync('git rev-parse HEAD')
        .toString()
        .replace(/[\r\n]/g, '');
      date = new Date(
        execSync('git log -1')
          .toString()
          .match(/Date:\s*(.*?)\n/)[1]
      ).toISOString();
    } catch (_err) {
      console.warn('Git not found in environment');
    }
  }

  detail =
    `Version: ${pkg.version}\n` +
    `Commit: ${commit}\n` +
    `Date: ${date}\n` +
    `Electron: ${process.versions.electron}\n` +
    `Chrome: ${process.versions.chrome}\n` +
    `Node.js: ${process.versions.node}\n` +
    `V8: ${process.versions.v8}\n` +
    `OS: ${os.type()} ${os.arch()} ${os.release()}${isSnap ? ' snap' : ''}`;

  const buttons = process.platform === 'linux' ? ['Copy', 'OK'] : ['OK', 'Copy'];

  console.log(detail);
  // remote.dialog
  //   .showMessageBox({
  //     title: pkg.name,
  //     type: 'info',
  //     message: pkg.name,
  //     detail: `\n${detail}`,
  //     buttons,
  //     noLink: true,
  //     defaultId: buttons.indexOf('OK'),
  //   })
  //   .then(({ response }) => {
  //     if (buttons[response] === 'Copy') {
  //       window.utools.copyText(detail);
  //     }
  //   })
  //   .catch((err) => {
  //     console.log(err);
  //   });
};
