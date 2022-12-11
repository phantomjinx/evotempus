const { merge } = require('webpack-merge');
const DotEnvPlugin = require('dotenv-webpack');
const path = require('path');
const common = require('./webpack.common.js');

const appRoot = path.resolve(__dirname, '../');
const src = path.resolve(appRoot, 'src');
const build = path.resolve(appRoot, 'build');
const public = path.resolve(appRoot, 'public');

module.exports = merge(common, {

  mode: 'development',
  devtool: 'inline-source-map',

  /*
   * Development server for debugging
   */
  devServer: {
    static: {
      directory: 'build',
    },
    devMiddleware: {
      writeToDisk: true,
    },
    port: 3000,
    historyApiFallback: true,
    hot: true,
    open: true
  },
  plugins: [
    /*
     * Provides different .env files for development and production
     */
    new DotEnvPlugin({
      path: path.resolve('env', 'development.env'),
      systemvars: true,
    })
  ],
  optimization: {
    usedExports: true,
  },
});
