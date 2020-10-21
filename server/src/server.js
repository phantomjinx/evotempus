// server.js
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
const argv = require('minimist')(process.argv.slice(2));
const logger = require('morgan');
const yaml = require('js-yaml')

var environment = process.env.NODE_ENV;

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
      console.error("ERROR: Trying to findByIdAndUpdate interval with %s: %s", parentId, err);
      return;
    }

    if (!parent) {
      console.error("ERROR: Failed to find or create interval with id %s", parentId);
      return;
    }

    var objId = parent._id;

    Interval.updateOne({ _id: child._id }, { parent: parent._id }, {runValidators: 'true'}).then((uChild, err) => {
      if (err) {
        console.error("ERROR: Child update for %s: %s", child._id, err);
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
    console.error(e);
    return;
  }

  //
  // Only insert a children array if not empty
  //
  var insert;
  if (children.length > 0) {
    insert = { _id: id, name: name, kind: kind, from: from, to: to, children: children };
  } else {
    insert = { _id: id, name: name, kind: kind, from: from, to: to};
  }

  //
  // Automatically deduplicates intervals
  //
  Interval.findByIdAndUpdate(
    { _id: id },
    { "$setOnInsert": insert },
    { upsert: true, new: true}
  ).then((interval, err) => {
      if (err) {
        console.error("ERROR: Trying to findByIdAndUpdate interval with %s: %s", id, err);
        return;
      }

      if (!interval) {
        console.error("ERROR: Failed to find or create interval with id %s", id);
        return;
      }

      findOrCreateParent(parent, interval);

    }).catch((err) => {
      console.error(err);
    });
}

function importIntervals(file) {

  console.log("Importing intervals from " + file);

  var liner = new readlines(file);

  var next;
  while (next = liner.next()) {
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
    console.error(e);
    return;
  }

  //
  // Automatically deduplicates subjects
  //
  Subject.findByIdAndUpdate(
    { _id: id },
    { "$setOnInsert": { _id: id, name: name, kind: kind, category: category, from: from, to: to } },
    { upsert: true, new: true}
  ).then((subject, err) => {
    if (err) {
      console.error("ERROR: Trying to findByIdAndUpdate subject with %s: %s", id, err);
      return;
    }

    if (!subject) {
      console.error("ERROR: Failed to find or create subject with id %s", id);
      return;
    }

  }).catch((err) => {
    console.error(err);
  });
}

function importSubjects(file) {

  console.log("Importing subjects from " + file);

  var liner = new readlines(file);

  var next;
  while (next = liner.next()) {
    line = next.toString('ascii');

    if (line.startsWith("#") || line.length == 0) {
      continue;
    }

    var elements = line.split('|');

    createSubject(elements[0], elements[1], elements[2], elements[3], elements[4]);
  }
}

// command line arguments ====================================

// Use -i to import the data into the database
let doImport = false;
if (argv.i)
  doImport = true;

// configuration ===========================================

// config files
let dbConfig = require('./config/db');

// set our port
let port = process.env.PORT || 6666;

// connect to our mongoDB database
// (uncomment after you enter in your own credentials in config/db.js)
let opts = {
  useUnifiedTopology: true,
  useNewUrlParser: true,
  useFindAndModify: false,
  useCreateIndex: true
};
mongoose.connect(dbConfig.url, opts);
let conn = mongoose.connection;

conn.on('Error', function() {
  console.error('ERROR: Database connection failed.');
});

conn.once('open', function() {
  console.log('INFO: Connection established');

  if (doImport) {
    console.log('INFO: Importing schema')
    conn.db.dropCollection('intervals', function(err, result) {
      if (err) {
        console.error("ERROR: Failed to drop intervals collection: %s", err);
      }

      conn.db.dropCollection('subjects', function(err, result) {
        if (err) {
          console.error("ERROR: Failed to drop subjects collection: %s", err);
        }

        console.log('INFO: Import from data directory')
        // Import the data if required into database
        importIntervals(path.resolve(__dirname, '..', dbConfig.intervals));
        importSubjects(path.resolve(__dirname, '..', dbConfig.subjects));
      });
    });

  } // End of doImport

  // Log middleware requests
  app.use(logger('dev'));

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

  // override with the X-HTTP-Method-Override header in the request. simulate DELETE/PUT
  app.use(methodOverride('X-HTTP-Method-Override'));

  // see ng-demos project for broadening out for production
  switch (environment) {
    case 'dev':
    default:
      console.log('INFO: ** DEV **');
      console.log('INFO: serving from ' + './src/client/ and ./');
      app.use('/', express.static('./src/client/'));
      app.use('/', express.static('./'));
      break;
  }

  // routes ==================================================
  require('./routes')(app); // configure our routes

  // start app ===============================================
  // startup our app at http://localhost:{PORT}
  app.listen(port, function() {
    console.log('INFO: Express server listening on port ' + port);
    console.log('INFO: env = ' + app.get('env') +
      '\n__dirname = ' + __dirname +
      '\nprocess.cwd = ' + process.cwd());
  });

  // shoutout to the user
  console.log('INFO: Server available on port ' + port);

  // expose app
  exports = module.exports = app;

});
