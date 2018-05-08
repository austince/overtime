const path = require('path')
const webpack = require('webpack')
const merge = require('webpack-merge')
const ChromeReloadPlugin = require('wcer')
const FriendlyErrorsPlugin = require('friendly-errors-webpack-plugin')
const {BundleAnalyzerPlugin} = require('webpack-bundle-analyzer')
const baseWebpack = require('./webpack.base')
const {styleLoaders} = require('./tools')

const plugins = [
  new webpack.NoEmitOnErrorsPlugin(),
  new webpack.DefinePlugin({
    'process.env.NODE_ENV': '"development"'
  }),
  new FriendlyErrorsPlugin(),

  new BundleAnalyzerPlugin({
    openAnalyzer: false,
  }),
]

module.exports = env => {
  console.log("Reload?", !env || !env['no_reload'])

  if (!env || !env['no_reload']) {
    plugins.push(new ChromeReloadPlugin({
      port: 9090,
      manifest: path.join(__dirname, '..', 'src', 'manifest.js')
    }))
  }

  return merge(baseWebpack, {
    // cheap-module-eval-source-map
    watch: true,
    module: {
      rules: styleLoaders({sourceMap: true})
    },
    devtool: '#cheap-module-eval-source-map',
    plugins,
  })
}
