const path = require('path')
const webpack = require('webpack')
const CopyWebpackPlugin = require('copy-webpack-plugin')
const {cssLoaders, htmlPage} = require('./tools')
const pkg = require('../package.json');

let resolve = dir => path.join(__dirname, '..', 'src', dir)
module.exports = {
  entry: {
    newtab: resolve('./newtab'),
    popup: resolve('./popup'),
    options: resolve('./options'),
    background: resolve('./backend'),
    vendor: ['vue', 'dexie', 'chrome-promise', 'bootstrap'],
  },
  output: {
    path: path.join(__dirname, '..', 'build'),
    publicPath: '/',
    filename: 'js/[name].js',
    chunkFilename: 'js/[id].[name].js?[hash]',
    library: '[name]'
  },
  resolve: {
    extensions: ['.js', '.vue', '.json'],
    alias: {
      'vue$': 'vue/dist/vue.esm.js',
      '@': resolve('src')
    }
  },
  module: {
    rules: [
      {
        test: /\.vue$/,
        loader: 'vue-loader',
        options: {
          extractCSS: true,
          loaders: {
            ...cssLoaders(),
            js: { loader: 'babel-loader' }
          },
          transformToRequire: {
            video: 'src',
            source: 'src',
            img: 'src',
            image: 'xlink:href'
          }
        }
      },
      {
        test: /\.js$/,
        loader: 'babel-loader',
        include:  [path.join(__dirname, '..', 'src'), path.join(__dirname, '..', 'test')],
      },
      {
        test: /\.(png|jpe?g|gif|svg)(\?.*)?$/,
        loader: 'url-loader',
        options: {
          limit: 10000,
          name: 'img/[name].[hash:7].[ext]'
        }
      },
      {
        test: /\.(mp4|webm|ogg|mp3|wav|flac|aac)(\?.*)?$/,
        loader: 'url-loader',
        options: {
          limit: 10000,
          name: 'media/[name].[hash:7].[ext]'
        }
      },
      {
        test: /\.(woff2?|eot|ttf|otf)(\?.*)?$/,
        loader: 'url-loader',
        options: {
          limit: 10000,
          name: 'fonts/[name].[hash:7].[ext]'
        }
      }
    ]
  },
  plugins: [
    // Extract all 3rd party modules into a separate 'vendor' chunk
    // new webpack.optimize.CommonsChunkPlugin({
    //   name: 'vendor',
    //   // minChunks: ({ resource }) => /node_modules/.test(resource),
    //   minChunks: Infinity,
    // }),

    htmlPage('New Tab', 'newtab', ['newtab']),
    htmlPage('popup', 'popup', ['popup']),
    htmlPage('options', 'options', ['options']),
    htmlPage('background', 'background', ['background']),

    new CopyWebpackPlugin([{ from: path.join(__dirname, '..', 'static') }]),

  ],
  performance: { hints: false },
}
