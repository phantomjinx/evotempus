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

// modules =================================================
const express = require('express');
const mongoose = require('mongoose');
const app = express();
const fs = require("fs");
const path = require("path");
const readlines = require('n-readlines');
const bodyParser = require('body-parser');
const methodOverride = require('method-override');
const Subject = require('./models/subject').Subject;
const Interval = require('./models/interval').Interval;
const IntervalDesc = require('./models/intervaldesc').IntervalDesc;
const cors = require('cors');
const loggerUtils = require('./logger');
const logger = loggerUtils.logger;
const expressLogger = loggerUtils.expressLogger;

const environment = process.env.NODE_ENV || 'development';
const doImport = process.env.IMPORT_DB || true;
const mongoDbURI = process.env.MONGODB_URI || 'mongodb://localhost/evotempus';
const port = process.env.PORT || 3000;

function displayName(id) {
  // Replace hypens with spaces
  name = id.replace(/-/g, " ");

  // Capitalize all words
  var s = name.toLowerCase().split(' ');
  for (var i = 0; i < s.length; i++) {
    // Assign it back to the array
    s[i] = s[i].charAt(0).toUpperCase() + s[i].substring(1);
  }

  return s.join(' ');
}

function parseNumber(numStr) {
  n = parseInt(numStr.trim());
  if (isNaN(n)) {
    throw "ERROR: Cannot convert 'from' value: " + numStr.trim();
  }

  return n;
}

function findOrCreateParent(parentId, child) {
  if (parentId.length == 0) {
    return;
  }

  Interval.findByIdAndUpdate(
    { _id: parentId },
    { upsert: true, new: true}
  ).then((parent, err) => {
    if (err) {
      logger.error("ERROR: Trying to findByIdAndUpdate interval with %s: %s", parentId, err);
      return;
    }

    if (!parent) {
      logger.error("ERROR: Failed to find or create interval with id %s", parentId);
      return;
    }

    var objId = parent._id;

    Interval.updateOne({ _id: child._id }, { parent: parent._id }, {runValidators: 'true'}).then((uChild, err) => {
      if (err) {
        logger.error("ERROR: Child update for %s: %s", child._id, err);
        return;
      }
    });
  });
}

function createInterval(id, kind, from, to, parent, children) {

  //
  // Ensure all whitespace is removed
  //
  id = id.trim();
  name = displayName(id);
  kind = kind.trim();
  parent = parent.trim();

  //
  // Check the children for empty elements
  //
  var c = [];
  for (i = 0; i < children.length; i++) {
    children[i] = children[i].trim();
    if (children[i].length > 0) {
      c.push(children[i]);
    }
  }
  children = c;

  try {
    //
    // Convert the from date to number
    //
    from = parseNumber(from);

    //
    // Convert the to date to number
    //
    to = parseNumber(to);
  } catch (e) {
    logger.error(e);
    return;
  }

  //
  // Only insert a children array if not empty
  //
  var set = { name: name, kind: kind, from: from, to: to};
  if (children.length > 0) {
    set.children = children;
  }

  //
  // Automatically deduplicates
  //
  Interval.findByIdAndUpdate(
    { _id: id },
    {
      "$set": set,
      "$setOnInsert": { _id: id }
    },
    { upsert: true, new: true}
  ).then((interval, err) => {
      if (err) {
        logger.error("ERROR: Trying to findByIdAndUpdate interval with %s: %s", id, err);
        return;
      }

      if (!interval) {
        logger.error("ERROR: Failed to find or create interval with id %s", id);
        return;
      }

      findOrCreateParent(parent, interval);

    }).catch((err) => {
      logger.error(err);
    });
}

function createIntervalDesc(intervalId, link, description) {
  //
  // Ensure all whitespace is removed
  //
  intervalId = intervalId.trim();
  linkId = link.trim();

  //
  // Automatically deduplicates
  //
  IntervalDesc.findOneAndUpdate(
    { interval: intervalId },
    {
      "$set": { linkId: linkId, link: link },
      "$setOnInsert": { interval: intervalId }
    },
    { upsert: true, new: true}
  ).then((desc, err) => {
    if (err) {
      logger.error("ERROR: Trying to findByOneAndUpdate interval description with %s: %s", intervalId, err);
      return;
    }

    if (!desc) {
      logger.error("ERROR: Failed to find or create interval description with interval id %s", intervalId);
      return;
    }

  }).catch((err) => {
    logger.error(err);
  });
}

function createSubject(id, kind, category, from, to) {

  //
  // Ensure all whitespace is removed
  //
  id = id.trim();
  name = displayName(id);
  kind = kind.trim();
  category = category.trim();

  try {
    //
    // Convert the from date to number
    //
    from = parseNumber(from);

    //
    // Convert the to date to number
    //
    to = parseNumber(to);
  } catch (e) {
    logger.error(e);
    return;
  }

  //
  // Automatically deduplicates
  //
  Subject.findByIdAndUpdate(
    { _id: id },
    {
      "$set":         { name: name, kind: kind, category: category, from: from, to: to },
      "$setOnInsert": { _id: id }
    },
    { upsert: true, new: true}
  ).then((subject, err) => {
    if (err) {
      logger.error("ERROR: Trying to findByIdAndUpdate subject with %s: %s", id, err);
      return;
    }

    if (!subject) {
      logger.error("ERROR: Failed to find or create subject with id %s", id);
      return;
    }

  }).catch((err) => {
    logger.error(err);
  });
}

function importIntervals(file) {
  logger.debug("Importing intervals from " + file);

  var liner = new readlines(file);

  var next;
  while (next = liner.next()) { // jshint ignore:line
    line = next.toString('ascii');

    if (line.startsWith("#") || line.length == 0) {
      continue;
    }

    var elements = line.split('|');

    var children = [];
    if (elements.length > 5) {
      children = elements[5].split(",");
    }

    createInterval(elements[0], elements[1], elements[2], elements[3], elements[4], children);
  }
}

function importIntervalDesc(file) {
  logger.debug("Importing interval descrptions from " + file);

  var liner = new readlines(file);

  var next;
  while (next = liner.next()) { // jshint ignore:line
    line = next.toString('ascii');

    if (line.startsWith("#") || line.length == 0) {
      continue;
    }

    var elements = line.split('|');

    createIntervalDesc(elements[0], elements[1], elements[2]);
  }
}

function importSubjects(file) {
  logger.debug("Importing subjects from " + file);

  var liner = new readlines(file);

  var next;
  while (next = liner.next()) { // jshint ignore:line
    line = next.toString('ascii');

    if (line.startsWith("#") || line.length == 0) {
      continue;
    }

    var elements = line.split('|');

    createSubject(elements[0], elements[1], elements[2], elements[3], elements[4]);
  }
}

function importDbData(conn) {
  if (!doImport) {
    return;
  }

  logger.debug('INFO: Import from data directory');
  // Import the data if required into database
  importIntervals(path.resolve(__dirname, '..', dbConfig.intervals));
  importIntervalDesc(path.resolve(__dirname, '..', dbConfig.intervalDesc));
  importSubjects(path.resolve(__dirname, '..', dbConfig.subjects));
}

function init() {
  // Log middleware requests
  app.use(expressLogger);

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

  // static content
  switch (environment) {
    case 'development':
      logger.info('INFO: ** DEV **');
      app.use('/', express.static('./'));
      break;
    default:
      logger.info('INFO: ** PRODUCTION **');
      appBuild = path.resolve(__dirname, '..', '..', 'app/build');
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
// (uncomment after you enter in your own credentials in config/db.js)
let opts = {
  useUnifiedTopology: true,
  useNewUrlParser: true,
  useFindAndModify: false,
  useCreateIndex: true
};
mongoose.connect(mongoDbURI, opts);
let conn = mongoose.connection;

conn.on('Error', function() {
  logger.error('ERROR: Database connection failed.');
});

conn.once('open', function() {
  logger.info('INFO: Connection established');

  try {
    importDbData(conn);

    init();
  } catch (err) {
    logger.error(err);
    conn.close();
  }
});
