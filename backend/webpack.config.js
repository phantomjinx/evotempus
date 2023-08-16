const path = require('path')
const nodeExternals = require('webpack-node-externals')
const NodemonPlugin = require('nodemon-webpack-plugin')

const {
  NODE_ENV = 'development',
} = process.env

module.exports = {
  entry: './src/mongo-rest-api.ts',
  mode: NODE_ENV,
  target: 'node',

  module: {
    rules: [
      {
        test: /\.ts$/,
        use: [
          'ts-loader',
        ]
      }
    ]
  },

  plugins: [
    new NodemonPlugin({
      // What to watch.
      watch: [path.resolve('dist'), path.resolve('data/*.dat')],
      ext: 'js',
      script: './dist/mongo-rest-api.js',

      // Arguments to pass to the script being watched.
      args: [],

      // Node arguments.
      nodeArgs: ['--inspect'],

      // Detailed log.
      verbose: true,

      // Environment variables to pass to the script to be restarted
      env: {
        NODE_ENV: 'development',
        MONGODB_URI: 'mongodb://localhost/evotempus',
        DROP_COLLECTIONS: false,
        IMPORT_DB: false,
        PORT: 3001,
        LOG_LEVEL: 'debug'
      },
    }),
  ],

  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'mongo-rest-api.js'
  },

  resolve: {
    extensions: ['.ts', '.js'],
  },

  externals: [
    nodeExternals()
  ],
}
