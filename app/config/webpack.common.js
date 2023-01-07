const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const TsconfigPathsPlugin = require('tsconfig-paths-webpack-plugin');

const appRoot = path.resolve(__dirname, '../');
const src = path.resolve(appRoot, 'src');
const build = path.resolve(appRoot, 'build');
const public = path.resolve(appRoot, 'public');

module.exports = {
  entry: {
    App: src + '/index.tsx'
  },
  output: {
    path: build,
    publicPath:  'auto',
    filename: 'bundle.js'
  },
  module: {
    rules: [
      {
        test: /\.(tsx|ts|jsx)?$/,
        use: ["ts-loader"],
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
        test: /\.(svg|jpg|jpeg|png|gif)$/i,
        exclude: /node_modules/,
        type: 'asset/inline',
      },
    ]
  },
  plugins: [
    /*
     * Make available no js files to bundling
     */
     new HtmlWebpackPlugin({
       favicon: path.resolve(src, 'assets', 'images', 'favicon.ico'),
       template: path.resolve(public, 'index.html'),
       manifest: path.resolve(public, 'manifest.json'),
     }),
  ],
  resolve: {
    extensions: ['.js', '.ts', '.tsx', '.jsx'],
    plugins: [
      new TsconfigPathsPlugin({
        configFile: path.resolve(appRoot, './tsconfig.json'),
      }),
    ],
    symlinks: false,
    cacheWithContext: false,
  }
};
