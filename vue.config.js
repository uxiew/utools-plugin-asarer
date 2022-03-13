/* eslint-disable @typescript-eslint/no-var-requires */
const path = require('path');
const { name } = require('./package.json');

module.exports = {
  parallel: false,
  publicPath: './',
  productionSourceMap: false,
  configureWebpack: (configs) => {
    // Object.assign(configs,{
    //     entry: {
    //       app: path.join(__dirname, './src/main.ts'),
    //       preload: path.join(__dirname, './public/preload.js')
    //     },
    // })
    // console.log(configs);
  },
};
