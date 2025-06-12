const path = require('path')
const nodeExternals = require('webpack-node-externals')
const NodemonPlugin = require('nodemon-webpack-plugin')
const dotenv = require('dotenv')

dotenv.config()

/*
 * env will hold dropCollections and importDB
 */
module.exports = (env) => {
  return {
    entry: './src/mongo-rest-api.ts',
    mode: process.env.buildType,
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
          NODE_ENV: process.env.build ?? 'development',
          MONGODB_URI: 'mongodb://127.0.0.1:27017/evotempus',
          DROP_COLLECTIONS: env.dropCollections ?? false,
          IMPORT_DB: env.importDB ?? false,
          USER: process.env.user ?? '',
          PASS: process.env.pass ?? '',
          PORT: process.env.port ?? 3001,
          LOG_LEVEL: process.env.logLevel ?? 'info'
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
}
