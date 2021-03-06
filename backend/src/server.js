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
const session = require('express-session');
const helmet = require("helmet");
const mongoose = require('mongoose');
const app = express();
const fs = require("fs");
const path = require("path");
const readlines = require('n-readlines');
const bodyParser = require('body-parser');
const methodOverride = require('method-override');
const Subject = require('./models/subject').Subject;
const Interval = require('./models/interval').Interval;
const Topic = require('./models/topic').Topic;
const Hint = require('./models/hints').Hint;
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

function parseNumber(numStr, id) {
  n = parseInt(numStr.trim());
  if (isNaN(n)) {
    throw "ERROR: Cannot convert 'from' value: " + numStr.trim() + " for id: " + id;
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
      logger.error(err, "ERROR: Trying to findByIdAndUpdate interval with %s", parentId);
      return;
    }

    if (!parent) {
      logger.error("ERROR: Failed to find or create interval with id %s", parentId);
      return;
    }

    var objId = parent._id;

    Interval.updateOne({ _id: child._id }, { parent: parent._id }, {runValidators: 'true'}).then((uChild, err) => {
      if (err) {
        logger.error(err, "ERROR: Child update for %s: %s", child._id);
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
    from = parseNumber(from, id);

    //
    // Convert the to date to number
    //
    to = parseNumber(to, id);
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
        logger.error(err, "ERROR: Trying to findByIdAndUpdate interval with %s", id);
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

function createTopic(id, topicTgt, linkId) {
  //
  // Ensure all whitespace is removed
  //
  id = id.trim();
  topicTgt = topicTgt.trim();
  linkId = linkId.trim();

  //
  // Automatically deduplicates
  //
  Topic.findOneAndUpdate(
    { topic: id },
    {
      "$set": { linkId: linkId, topicTarget: topicTgt},
      "$setOnInsert": { topic: id }
    },
    { upsert: true, new: true}
  ).then((topic, err) => {
    if (err) {
      logger.error(err, "ERROR: Trying to findByOneAndUpdate description with %s", id);
      return;
    }

    if (!topic) {
      logger.error("ERROR: Failed to find or create description with id %s", id);
      return;
    }

  }).catch((err) => {
    logger.error(err);
  });
}

function createSubject(id, kind, category, from, to) {

  logger.debug("Creating subject: id: " + id + " kind: " + kind + " category: " + category + " from: " + from + " to: " + to);

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
    from = parseNumber(from, id);

    //
    // Convert the to date to number
    //
    to = parseNumber(to, id);
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
      logger.error(err, "ERROR: Trying to findByIdAndUpdate subject with %s", id);
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

function createHint(id, type, colour) {

  logger.debug("Creating hint: id: " + id + " type: " + type + " colour: " + colour);

  //
  // Ensure all whitespace is removed
  //
  id = id.trim();
  type = type.trim();
  colour = colour.trim();

  //
  // Automatically deduplicates
  //
  Hint.findByIdAndUpdate(
    { _id: id },
    {
      "$set":         { type: type, colour: colour },
      "$setOnInsert": { _id: id }
    },
    { upsert: true, new: true}
  ).then((hint, err) => {
    if (err) {
      logger.error(err, "ERROR: Trying to findByIdAndUpdate hint with %s", id);
      return;
    }

    if (!hint) {
      logger.error("ERROR: Failed to find or create hint with id %s", id);
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

function importTopics(file, topicTarget) {
  logger.debug("Importing topic descriptions from " + file);

  var liner = new readlines(file);

  var next;
  while (next = liner.next()) { // jshint ignore:line
    line = next.toString('ascii');

    if (line.startsWith("#") || line.length == 0) {
      continue;
    }

    var elements = line.split('|');

    createTopic(elements[0], topicTarget, elements[1]);
  }
}

function importHints(file) {
  logger.debug("Importing hints from " + file);

  var liner = new readlines(file);

  var next;
  while (next = liner.next()) { // jshint ignore:line
    line = next.toString('ascii');

    if (line.startsWith("#") || line.length == 0) {
      continue;
    }

    var elements = line.split('|');

    createHint(elements[0], elements[1], elements[2]);
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
    const id = elements[0];
    const kind = elements[1];
    const category = elements[2];
    const from = elements[3];
    const to = elements[4];
    const linkId = elements[5];

    createSubject(id, kind, category, from, to);

    createTopic(id, "Subject", linkId);
  }
}

function cleanDb(conn) {
  if (process.env.DROP_COLLECTIONS !== 'true') {
    return Promise.resolve('Dropping collections not enabled');
  }

  logger.debug('INFO: Dropping collections from database');

  const promInt = conn.db.dropCollection('intervals');
  const promSub = conn.db.dropCollection('subjects');
  const promTop = conn.db.dropCollection('topics');

  return Promise.all([promInt, promSub, promTop]);
}

function importDbData(conn) {
  if (!doImport) {
    return;
  }

  logger.debug('INFO: Import from data directory');
  // Import the data if required into database
  importIntervals(path.resolve(__dirname, '..', dbConfig.intervals));
  importTopics(path.resolve(__dirname, '..', dbConfig.intervalTopics), "Interval");
  importSubjects(path.resolve(__dirname, '..', dbConfig.subjects));
  importHints(path.resolve(__dirname, '..', dbConfig.hints));
}

function init() {
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
  useCreateIndex: true,
  autoIndex: true
};

mongoose.set('debug', process.env.LOG_LEVEL === 'debug');
mongoose.connect(mongoDbURI, opts);
let conn = mongoose.connection;

Interval.on('index', function(err) {
  if (err) {
    logger.error(err, 'Interval index error');
  } else {
    logger.debug('Interval indexing complete');
  }
});

Subject.on('index', function(err) {
  if (err) {
    logger.error(err, 'Subject index error');
  } else {
    logger.debug('Subject indexing complete');
  }
});

Topic.on('index', err => {
  if (err) {
    logger.error(err, 'Topic index error');
  } else {
    logger.debug('Topic indexing complete');
  }
});

conn.on('Error', () => {
  logger.error('ERROR: Database connection failed.');
});

conn.once('open', () => {
  logger.info('INFO: Connection established');

  try {
    cleanDb(conn).then(answer => {
      logger.debug(answer);
      logger.debug("INFO: Database cleaning complete");

      importDbData(conn);

      init();
    });


  } catch (err) {
    logger.error(err);
    conn.close();
  }
});
