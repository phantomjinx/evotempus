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

const loggerUtils = require('./logger');
const logger = loggerUtils.logger;
const readlines = require('n-readlines');
const fs = require("fs");
const pathlib = require("path");
const utils = require('./utils.js');
const evoDb = require('./connection.js');
const Subject = require('./models/subject').Subject;
const Interval = require('./models/interval').Interval;
const Topic = require('./models/topic').Topic;
const Hint = require('./models/hints').Hint;

function findOrCreateIntervalParent(parentId, child) {
  if (parentId.length == 0) {
    return;
  }

  Interval.findByIdAndUpdate({
    _id: parentId
  }, {
    upsert: true,
    new: true
  }).then((parent, err) => {
    if (err) {
      logger.error(err, "ERROR: Trying to findByIdAndUpdate interval with %s", parentId);
      evoDb.terminate();
    }

    if (!parent) {
      logger.error("ERROR: Failed to find or create interval with id %s", parentId);
      evoDb.terminate();
    }

    var objId = parent._id;

    Interval.updateOne({
      _id: child._id
    }, {
      parent: parent._id
    }, {
      runValidators: 'true'
    }).then((uChild, err) => {
      if (err) {
        logger.error(err, "ERROR: Child update for %s: %s", child._id);
        evoDb.terminate();
      }
    });
  });
}

function createInterval(id, kind, from, to, parent, children) {

  //
  // Ensure all whitespace is removed
  //
  id = id.trim();
  const name = utils.displayName(id);
  kind = kind.trim();
  parent = parent.trim();

  //
  // Check the children for empty recValue
  //
  var c = [];
  for (let i = 0; i < children.length; i++) {
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
    from = utils.parseNumber(from, id);

    //
    // Convert the to date to number
    //
    to = utils.parseNumber(to, id);
  } catch (err) {
    evoDb.terminate();
  }

  //
  // Only insert a children array if not empty
  //
  var set = {
    name: name,
    kind: kind,
    from: from,
    to: to
  };
  if (children.length > 0) {
    set.children = children;
  }

  //
  // Automatically deduplicates
  //
  return Interval.findByIdAndUpdate({
    _id: id
  }, {
    "$set": set,
    "$setOnInsert": {
      _id: id
    }
  }, {
    upsert: true,
    new: true
  }).exec();
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
  return Topic.findOneAndUpdate({
    topic: id
  }, {
    "$set": {
      linkId: linkId,
      topicTarget: topicTgt
    },
    "$setOnInsert": {
      topic: id
    }
  }, {
    upsert: true,
    new: true
  }).exec();
}

function createSubject(id, kind, category, from, to) {

  logger.debug("Creating subject: id: " + id + " kind: " + kind + " category: " + category + " from: " + from + " to: " + to);

  //
  // Ensure all whitespace is removed
  //
  id = id.trim();
  const name = utils.displayName(id);
  kind = kind.trim();
  category = category.trim();

  //
  // Convert the from date to number
  //
  from = utils.parseNumber(from, id);

  //
  // Convert the to date to number
  //
  to = utils.parseNumber(to, id);

  //
  // Automatically deduplicates
  //
  return Subject.findByIdAndUpdate({
    _id: id
  }, {
    "$set": {
      name: name,
      kind: kind,
      category: category,
      from: from,
      to: to
    },
    "$setOnInsert": {
      _id: id
    }
  }, {
    upsert: true,
    new: true,
    runValidators: true
  }).exec();
}

function createHint(id, type, parent, colour, link) {

  logger.debug("Creating hint: id: " + id + " type: " + type + " parent: " + parent + " colour: " + colour + " link: " + link);

  try {
    //
    // Ensure all whitespace is removed
    //
    id = id.trim();
    type = type.trim();
    parent = parent.trim();
    colour = colour.trim();
    link = link.trim();

    if (parent == "<>") {
      parent = "";
    }

    if (colour == "<>") {
      colour = "";
    }

    if (link == "<>") {
      link = "";
    }
  } catch (err) {
    evoDb.terminate();
  }

  //
  // Automatically deduplicates
  //
  return Hint.findByIdAndUpdate({
    _id: id
  }, {
    "$set": {
      type: type,
      parent: parent,
      colour: colour,
      link: link
    },
    "$setOnInsert": {
      _id: id
    }
  }, {
    upsert: true,
    new: true
  }).exec();
}

async function importReader(path, expectedCols, importPromise) {
  const liner = new readlines(path);

  let next;
  let promises = [];
  while (next = liner.next()) { // jshint ignore:line
    const line = next.toString('ascii');

    if (line.startsWith("#") || line.length == 0) {
      continue;
    }

    const recValue = line.split('|');
    if (recValue.length < expectedCols) {
      logger.error("ERROR: Number of columns in record is smaller than expected: " + line);
      evoDb.terminate();
    }

    const p = importPromise(recValue);
    if (p == null) {
      logger.error("ERROR: Undefined promise return from callback: ", recValue);
      evoDb.terminate();
    }
    promises.push(p);

    if (promises.length == 200) {
      logger.debug("INFO: Resolving batch of updates for " + path);
      const values = await Promise.all(promises);
      promises = [];
    }
  }

  if (promises.length > 0) {
    logger.debug("INFO: Resolving final batch of updates for " + path);
    const values = await Promise.all(promises);
    promises = [];
  }

  logger.debug("INFO: Completed importing data from " + path);
}

async function importContent(pathOrPaths, expectedCols, importPromise) {
  let paths = [];
  if (Array.isArray(pathOrPaths)) {
    paths = paths.concat(pathOrPaths);
  } else {
    paths.push(pathOrPaths);
  }

  for (let i = 0; i < paths.length; i++) {
    const fullPath = pathlib.resolve(__dirname, '..', paths[i]);
    if (fs.statSync(fullPath).isDirectory()) {
      const files = fs.readdirSync(fullPath);
      for (let j = 0; i < files.length; j++) {
        if (pathlib.extname(files[j]) == ".dat") {
          await importReader(pathlib.resolve(fullPath, files[j]), expectedCols, importPromise);
        }
      }
    } else {
      await importReader(fullPath, expectedCols, importPromise);
    }
  }

}

async function importIntervals(pathOrPaths) {
  var importer = function(recValue) {
    var children = [];
    if (recValue.length > 5) {
      children = recValue[5].split(",");
    }

    return createInterval(recValue[0], recValue[1], recValue[2], recValue[3], recValue[4], children);
  };

  await importContent(pathOrPaths, 5, importer);
  logger.debug("INFO: import of intervals complete");
}

async function importTopics(pathOrPaths, topicTarget) {
  var importer = function(recValue) {
    return createTopic(recValue[0], topicTarget, recValue[1]);
  };

  await importContent(pathOrPaths, 2, importer);
  logger.debug("INFO: import of topics complete");
}

async function importHints(pathOrPaths) {
  var importer = function(recValue) {
    return createHint(recValue[0], recValue[1], recValue[2], recValue[3], recValue[4]);
  };

  await importContent(pathOrPaths, 5, importer);
  logger.debug("INFO: import of hints complete");
}

function importSubjectCb(recValue) {
  const id = recValue[0];
  const kind = recValue[1];
  const category = recValue[2];
  const from = recValue[3];
  const to = recValue[4];
  const linkId = recValue[5];


  const p1 = createSubject(id, kind, category, from, to);
  const p2 = createTopic(id, "Subject", linkId);
  return Promise.all([p1, p2]);
}

async function importSubjects(pathOrPaths) {
  await importContent(pathOrPaths, 6, importSubjectCb);
  logger.debug("INFO: import of subjects complete");
}

module.exports = { importIntervals, importTopics, importHints, importSubjects };
