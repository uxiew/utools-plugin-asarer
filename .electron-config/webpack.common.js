'use strict'

const path = require('path')

module.exports = {
  target: 'web',
  entry: {
    main: path.join(__dirname, '../src/main.ts')
  },
  output: {
    filename: '[name].js',
    libraryTarget: 'umd',
    path: path.join(__dirname, '../dist')
  }
}
