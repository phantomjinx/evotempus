const path = require('path')
const nodeExternals = require('webpack-node-externals')
const NodemonPlugin = require('nodemon-webpack-plugin')

module.exports = (env) => {
  return {
    entry: './src/mongo-rest-api.ts',
    mode: env.buildType,
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
          NODE_ENV: env.build || 'development',
          MONGODB_URI: 'mongodb://localhost/evotempus',
          DROP_COLLECTIONS: env.dropCollections || false,
          IMPORT_DB: env.importDB || false,
          PORT: env.port || 3001,
          LOG_LEVEL: env.logLevel || 'info'
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
