const webpack = require('webpack')
const merge = require('webpack-merge')
const ChromeReloadPlugin = require('wcer')
const FriendlyErrorsPlugin = require('friendly-errors-webpack-plugin')
const path = require('path')
const baseWebpack = require('./webpack.base')
const {styleLoaders} = require('./tools')

module.exports = merge(baseWebpack, {
  // cheap-module-eval-source-map
  watch: true,
  module: {
    rules: styleLoaders({sourceMap: false})
  },
  devtool: '#cheap-module-eval-source-map',
  plugins: [
    new webpack.NoEmitOnErrorsPlugin(),
    new webpack.DefinePlugin({
      'process.env.NODE_ENV': '"development"'
    }),
    new FriendlyErrorsPlugin(),
    new ChromeReloadPlugin({
      port: 9090,
      manifest: path.join(__dirname, '..', 'src', 'manifest.js')
    }),
  ]
})
