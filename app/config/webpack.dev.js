const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const DotEnvPlugin = require('dotenv-webpack');

const appRoot = path.resolve(__dirname, '../');
const src = path.resolve(appRoot, 'src');
const build = path.resolve(appRoot, 'build');
const public = path.resolve(appRoot, 'public');

module.exports = (env) => {

  console.log(env.config);

  return {
    mode: 'development',
    entry: {
      App: src + '/index.js'
    },
    output: {
      path: build,
      publicPath:  'auto',
      filename: 'bundle.js'
    },
    devtool: 'inline-source-map',

    /*
     * Development server for debugging
     */
    devServer: {
      static: {
        directory: build,
      },
      devMiddleware: {
        writeToDisk: true,
      },
      port: 3000,
      historyApiFallback: true,
      hot: true,
      open: true
    },
    module: {
      rules: [
        {
          test: /\.(js|jsx)$/,
          exclude: /node_modules/,
          use: ['babel-loader']
        },
        {
          test: /\.(css|less)$/,
          use: ["style-loader", "css-loader"]
        },
        {
          test: /\.(s(a|c)ss)$/,
          use: ["style-loader", "css-loader", "sass-loader"],
        },
        {
          test: /\.(ttf|eot|woff|woff2)$/,
          type: 'asset/resource',
        },
        {
          test: /\.(jpe?g|png|gif|svg)$/i,
          exclude: /node_modules/,
          type: 'asset/resource',
        }
      ]
    },
    plugins: [
      /*
       * Make available no js files to bundling
       */
       new HtmlWebpackPlugin({
         favicon: path.resolve(src, 'images', 'favicon.ico'),
         template: path.resolve(public, 'index.html'),
         manifest: path.resolve(public, 'manifest.json'),
       }),
       /*
        * Provides different .env files for development and production
        */
      new DotEnvPlugin({
        path: path.resolve(appRoot, 'env', `${env.config}.env`),
        systemvars: true,
      })
    ]
  }
};
