/*
 * Copyright (C) 2023 Paul G. Richardson
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

/* jshint node: true */
"use strict"

// modules =================================================
import express from 'express'
import session, { SessionOptions } from 'express-session'
import MongoStore from 'connect-mongo'
import { CollectionInfo } from 'mongodb'
import helmet from 'helmet'
import mongoose, { Connection } from 'mongoose'
import path from 'path'
import methodOverride from 'method-override'
import cors from 'cors'
import { customErrorHandler } from './error-handler'

import { SubjectModel, IntervalModel, TopicModel } from './models'

import { logger, expressLogger } from './logger'
import { EvoDb, evoDb } from './connection'
import { evoDataConfig } from './config'
import * as importing from './import'
import * as utils from './utils'

import { intervalApi, subjectApi, topicApi, hintApi, searchApi } from './api'

export const app = express()

const environment = process.env.NODE_ENV || 'development'
const doImport = utils.toBoolean(process.env.IMPORT_DB, true)
const dropCollections = utils.toBoolean(process.env.DROP_COLLECTIONS, true)
const mongoDbURI = process.env.MONGODB_URI || 'mongodb://localhost/evotempus'
const port = process.env.PORT || 3000

//
// Load categories in first
// The load subject, if no category then do not use - rules out phylum unspecified
//

function checkEvoDbConn(conn: Connection|undefined): conn is Connection {
  if (! conn) {
    console.trace()
    logger.error('ERROR: Database connection failed.')
    evoDb.terminate()
  }

  return (conn as Connection).db !== undefined
}

async function cleanDb(evoDb: EvoDb): Promise<void> {
  checkEvoDbConn(evoDb.conn)

  if (!dropCollections) {
    logger.info('Dropping collections not enabled')
    return
  }

  logger.debug('INFO: Dropping collections from database')

  const collections = await evoDb?.conn?.db.listCollections().toArray() || []
  for (let i = 0; i < collections.length; ++i) {
    const collection = collections[i] as CollectionInfo

    if (collection.name === 'intervals' || collection.name === 'subjects' ||
        collection.name === 'topics' ||collection.name === 'hints') {
        await evoDb?.conn?.db.dropCollection(collection.name)
    }
  }

  logger.debug('INFO: Dropping collections from database completed')
}

async function importDbData(evoDb: EvoDb) {
  checkEvoDbConn(evoDb.conn)

  if (!doImport) {
    return
  }

  logger.info("INFO: Database importing commencing ...")

  try {
    // Import the data if required into database
    await importing.importIntervals(evoDataConfig.intervals)

    await importing.importIntervalTopics(evoDataConfig.intervalTopics)

    await importing.importHints(evoDataConfig.hints)

    await importing.importSubjects(evoDataConfig.subjects)

    await importing.importTags(evoDataConfig.tags)

    importing.reportStats()

    logger.info("INFO: Database importing complete")

  } catch (err) {
    logger.error(err)
    evoDb.terminate()
  }
}

async function indexDb() {
  await IntervalModel.collection.createIndex({ "$**": "text" })
  await IntervalModel.collection.createIndex({ "name": 1 })

  await TopicModel.collection.createIndex({ "$**": "text" })
  await TopicModel.collection.createIndex({ "topic": 1 })
  await TopicModel.collection.createIndex({ "topicTarget": 1 })
  await TopicModel.collection.createIndex({ "description": 1 })

  await SubjectModel.collection.createIndex({ "$**": "text" })
  await SubjectModel.collection.createIndex({ "name": 1 })
  await SubjectModel.collection.createIndex({ "tags": 1 })

  logger.debug("INFO: Database indexing complete")
}

function init(evoDb: EvoDb) {
  checkEvoDbConn(evoDb.conn)

  logger.debug("INFO: Initialising the server application on port " + port)

  // Log middleware requests
  app.use(expressLogger)

  // Heightens security providing headers
  app.use(helmet())

  const storeOptions = {
    client: evoDb.conn?.getClient(),
    dbName: "evotempus-db-mongoose",
    stringify: false,
    autoRemoveInterval: 1
  }

  // Change the default session name
  // and restrict cookie
  const sessionConfig: SessionOptions = {
    secret: 'secret',
    name: 'evotempus',
    resave: false,
    saveUninitialized: true,
    cookie: {
      sameSite: 'strict',
      secure: environment !== 'development'
    },
    store: MongoStore.create(storeOptions),
  }

  if (environment !== 'development') {
    app.set('trust proxy', 1) // trust first proxy
  }

  app.use(session(sessionConfig))

  // get all data/stuff of the body (POST) parameters
  // parse application/json
  app.use(express.json())

  // Cross Origin Support
  app.use(cors())


  // override with the X-HTTP-Method-Override header in the request. simulate DELETE/PUT
  app.use(methodOverride('X-HTTP-Method-Override'))

  // routes
  app.use('/api/intervals', intervalApi)
  app.use('/api/subjects', subjectApi)
  app.use('/api/topics', topicApi)
  app.use('/api/hints', hintApi)
  app.use('/api/search', searchApi)

  // json supported error handler
  // must be defined after the routes have been defined
  app.use(customErrorHandler)

  // static content
  switch (environment) {
    case 'development':
      logger.info('INFO: ** DEV **')
      app.use('/', express.static('./'))
      break
    default:
      logger.info('INFO: ** PRODUCTION **')
      const appBuild = path.resolve(__dirname, '..', '..', 'app/build')
      app.use('/', express.static(appBuild))
      break
  }

  // startup app at http://localhost:{PORT}
  app.listen(port, function() {
    logger.info('INFO: Server listening on port ' + port)
  })
}

// connect to our mongoDB database
mongoose.set('debug', process.env.LOG_LEVEL === 'debug')

console.log(mongoDbURI)
console.log(evoDb)

mongoose.connect(mongoDbURI, evoDb.options)
  .catch(error => {
    logger.error(error)
    process.exit(1)
  })

mongoose.connection.on('error', err => {
  logger.error('ERROR: Database connection failed:', err)
  evoDb.terminate()
})

//
// Detect unhandled promise rejections
//
process.on('unhandledRejection', (err) => {
  logger.error(err)
  evoDb.terminate()
})

async function prepareDatabase() {
  try {
    await cleanDb(evoDb)

    await importDbData(evoDb)

    await indexDb()

    // await groupSubjects(evoDb.conn)

    init(evoDb)
  } catch (err) {
    logger.error(err)
    evoDb.terminate()
  }
}

mongoose.connection.once('open', () => {
  evoDb.conn = mongoose.connection
  checkEvoDbConn(evoDb.conn)
  logger.info('INFO: Connection established to database on ' + evoDb.conn?.host + ":" + evoDb.conn?.port)
  prepareDatabase()
})
