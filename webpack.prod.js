const path = require('path');

module.exports = {
  target: 'electron-preload',
  entry: {
    preload: path.join(__dirname, './utools/preload.js'),
  },
  output: {
    filename: '[name].js',
    libraryTarget: 'commonjs2',
    path: path.join(__dirname, './dist'),
  },
};
