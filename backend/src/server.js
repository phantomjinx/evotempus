/*
 * Copyright (C) 2020 Paul G. Richardson
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

/* jshint node: true */
"use strict";

// modules =================================================
const express = require('express');
const session = require('express-session');
const helmet = require("helmet");
const mongoose = require('mongoose');
const app = express();
const path = require("path");
const bodyParser = require('body-parser');
const methodOverride = require('method-override');
const Subject = require('./models/subject').Subject;
const Interval = require('./models/interval').Interval;
const Topic = require('./models/topic').Topic;
const Hint = require('./models/hints').Hint;
const cors = require('cors');
const loggerUtils = require('./logger');
const evoDb = require('./connection.js');
const importing = require('./import');
const utils = require('./utils');
const logger = loggerUtils.logger;
const expressLogger = loggerUtils.expressLogger;

const environment = process.env.NODE_ENV || 'development';
const doImport = utils.toBoolean(process.env.IMPORT_DB, true);
const dropCollections = utils.toBoolean(process.env.DROP_COLLECTIONS, true);
const mongoDbURI = process.env.MONGODB_URI || 'mongodb://localhost/evotempus';
const port = process.env.PORT || 3000;

//
// Load categories in first
// The load subject, if no category then do not use - rules out phylum unspecified
//

async function cleanDb(conn) {
  if (!dropCollections) {
    return Promise.resolve('Dropping collections not enabled');
  }

  logger.debug('INFO: Dropping collections from database');

  const collections = await evoDb.conn.db.listCollections().toArray();
  for (var i = 0; i < collections.length; ++i) {
    if (collections[i].name === 'intervals' || collections[i].name === 'subjects' ||
        collections[i].name === 'topics' ||collections[i].name === 'hints') {
        await evoDb.conn.db.dropCollection(collections[i].name);
    }
  }

  logger.debug('INFO: Dropping collections from database completed');
}

async function importDbData(conn) {
  if (!doImport) {
    return;
  }

  try {
    // Import the data if required into database
    await importing.importIntervals(dbConfig.intervals);

    await importing.importIntervalTopics(dbConfig.intervalTopics);

    await importing.importHints(dbConfig.hints);

    await importing.importSubjects(dbConfig.subjects);

    importing.reportStats();

    logger.debug("INFO: Database importing complete");

  } catch (err) {
    logger.error(err);
    evoDb.terminate();
  }
}

async function indexDb(conn) {
  await Interval.collection.createIndex({ name: 'text', kind: 'text' });
  await Topic.collection.createIndex({ topic: 'text', description: 'text' });
  await Subject.collection.createIndex({ name: 'text', kind: 'text', category: 'text' });

  logger.debug("INFO: Database indexing complete");
}

const laneMAX = 15;

function subjectOverlaps(lane, subject) {
  const buffer = Math.abs(0.01 * Math.max(subject.from, subject.to));

  for (let i = 0; i < lane.length; ++i) {
    const s = lane[i];
    const bufferedFrom = subject.from - buffer;
    const bufferedTo = subject.to + buffer;

    if (bufferedTo > s.from && bufferedFrom <= s.to) {
      // where subject.to falls within s.range
      return true;
    }

    if (bufferedFrom >= s.from && bufferedFrom < s.to) {
      // where subject.from falls within s.range
      return true;
    }

    if (bufferedFrom <= s.from && bufferedTo >= s.to) {
      // where subject.range is wider than s.range
      return true;
    }
  }

  return false;
}

// bin is an array of lanes
function addSubjectToBin(bin, subject) {
  for (let i = 0; i < bin.length; i++) {
    let lane = bin[i];
    const overlaps = subjectOverlaps(lane, subject);
    if (! overlaps) {
      lane.push(subject);
      return true;
    }
  }

  //
  // Restrict number of lanes to laneMax for this bin
  //
  if (bin.length < laneMAX) {
    //
    // Subject could not be added to existing lanes
    // Create a new lane
    //
    let lane = [];
    lane.push(subject);
    bin.push(lane);
    return true;
  }

  return false;
}

function addSubjectToBins(bins, subject) {
  for (const bin of bins) {
    if (addSubjectToBin(bin, subject)) {
      return;
    }
  }

  // Subject not added yet
  let bin = [];
  addSubjectToBin(bin, subject);
  bins.push(bin);
}

async function groupSubjects(conn) {
  const subjects = await Subject.find()
  .sort({ "category": 1, "from": 1, "to": 1 })
  .exec();

  logger.debug("Subjects: " + subjects.length);

  const kindMap = new Map();
  subjects.forEach((subject, index) => {
    let subjects = kindMap.get(subject.kind);
    if (!subjects) {
      subjects = [];
      kindMap.set(subject.kind, subjects);
    }

    subjects.push(subject);
  });

  const s = kindMap.get("Plant").sort((s1, s2) => {
    const s1r = s1.to - s1.from;
    const s2r = s2.to - s2.from;
    return s2r - s1r;
  });

  const binsMap = new Map();
  s.forEach((subject, index, kind) => {
    console.log(subject.name + " " + subject.from + " " + (subject.to - subject.from));
    let bins = binsMap.get(subject.kind);
    if (!bins) {
      bins = [];
      binsMap.set(subject.kind, bins);
    }

    addSubjectToBins(bins, subject);
    if (index % 1000 == 0) {
      console.log("Kind: " + subject.kind + " - Added " + subject.name + " (" + (index + 1) + " of " + kind.length + ") - Size: " + bins.length);
    }
  });

  console.log("\n\n=== Group Results ===");
  const binsKeys = Array.from(binsMap.keys()).sort();

  const laneSizes = new Map();
  for (const kind of binsKeys.values()) {
    const bins = binsMap.get(kind);
    let output = "Kind: " + kind + " - Bins: " + String(bins.length).padStart(3, '0') + "\n";
    for (let i = 0; i < bins.length; ++i) {
      const bin = bins[i];
      output = output.concat(" Bin[" + String((i + 1)).padStart(3, '0') + "]: ");

      for (let j = 0; j < bin.length; ++j) {
        const lane = bin[j];
        const laneSizeKey = String(lane.length);
        let freq = laneSizes.get(laneSizeKey);
        if (!freq) {
          laneSizes.set(laneSizeKey, 1);
        } else {
          laneSizes.set(laneSizeKey, (freq + 1));
        }

        output = output.concat(" L" + String((j + 1)).padStart(2, '0') + ": " + String(lane.length).padStart(2, '0'));
      }
      output = output.concat("\n");
    }
    console.log(output);

    const lastbin = bins[bins.length - 1];
    for (const lane of lastbin) {
      for (const subject of lane) {
        console.log(subject.name + ": " + subject.from + " - " + subject.to);
      }
    }

    const laneSizesKeys = Array.from(laneSizes.keys()).sort();
    for (const laneSize of laneSizesKeys.values()) {
      const freq = laneSizes.get(laneSize);
      console.log("Lane Size " + laneSize + ": " + freq);
    }
  }
}

function init() {
  logger.debug("INFO: Initialising the server application on port " + port);

  // Log middleware requests
  app.use(expressLogger);

  // Heightens security providing headers
  app.use(helmet());

  // Change the default session name
  // and restrict cookie
  const sessionConfig = {
    secret: 'secret',
    name: 'evotempus',
    resave: false,
    saveUninitialized: true,
    cookie : {
      sameSite: 'strict',
    }
  };

  app.use(session(sessionConfig));

  // get all data/stuff of the body (POST) parameters
  // parse application/json
  app.use(bodyParser.json());

  // parse application/vnd.api+json as json
  app.use(bodyParser.json({
    type: 'application/vnd.api+json'
  }));

  // parse application/x-www-form-urlencoded
  app.use(bodyParser.urlencoded({
    extended: true
  }));

  // Cross Origin Support
  app.use(cors());

  // override with the X-HTTP-Method-Override header in the request. simulate DELETE/PUT
  app.use(methodOverride('X-HTTP-Method-Override'));

  // routes
  const intervals = require('./api/intervals');
  app.use('/api/intervals', intervals);

  const subjects = require('./api/subjects');
  app.use('/api/subjects', subjects);

  const topics = require('./api/topics');
  app.use('/api/topics', topics.router);

  const hints = require('./api/hints');
  app.use('/api/hints', hints);

  const search = require('./api/search');
  app.use('/api/search', search);

  // static content
  switch (environment) {
    case 'development':
      logger.info('INFO: ** DEV **');
      app.use('/', express.static('./'));
      break;
    default:
      logger.info('INFO: ** PRODUCTION **');
      var appBuild = path.resolve(__dirname, '..', '..', 'app/build');
      app.use('/', express.static(appBuild));
      break;
  }

  // startup app at http://localhost:{PORT}
  app.listen(port, function() {
    logger.info('INFO: Server listening on port ' + port);
  });

  // expose app
  exports = module.exports = app;
}

// configuration ===========================================

// config files
let dbConfig = require('./config/db');

// connect to our mongoDB database
mongoose.set('debug', process.env.LOG_LEVEL === 'debug');
mongoose.connect(mongoDbURI, evoDb.options);
evoDb.conn = mongoose.connection;

evoDb.conn.on('Error', () => {
  logger.error('ERROR: Database connection failed.');
  evoDb.terminate();
});

//
// Detect unhandled promise rejections
//
process.on('unhandledRejection', (err) => {
  logger.error(err);
  evoDb.terminate();
});

async function prepareDatabase() {
  try {
    await cleanDb(evoDb.conn);

    await importDbData(evoDb.conn);

    await indexDb(evoDb.conn);

    await groupSubjects(evoDb.conn);

    init();
  } catch (err) {
    logger.error(err);
    evoDb.terminate();
  }
}

evoDb.conn.once('open', () => {
  logger.info('INFO: Connection established to database on ' + evoDb.conn.host + ":" + evoDb.conn.port);
  prepareDatabase();
});
