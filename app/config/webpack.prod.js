const { merge } = require('webpack-merge');
const DotEnvPlugin = require('dotenv-webpack');
const path = require('path');
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const CssMinimizerPlugin = require("css-minimizer-webpack-plugin");
const common = require('./webpack.common.js');

const appRoot = path.resolve(__dirname, '../');
const src = path.resolve(appRoot, 'src');
const build = path.resolve(appRoot, 'build');
const public = path.resolve(appRoot, 'public');

module.exports = merge(common, {

  mode: 'production',
  // see https://webpack.js.org/guides/production/#source-mapping why this is included
  devtool: 'source-map',

  plugins: [
    /*
     * Provides different .env files for development and production
     */
    new DotEnvPlugin({
      path: path.resolve('env', 'production.env'),
      systemvars: true,
    }),
    new MiniCssExtractPlugin({
      filename: "[name].css",
      chunkFilename: "[id].css",
    }),
  ],
  module: {
    rules: [
      {
        test: /\.css$/,
        use: [MiniCssExtractPlugin.loader, "css-loader"],
      },
    ],
  },
  optimization: {
    minimizer: [
      new CssMinimizerPlugin(),
    ],
  },

});
