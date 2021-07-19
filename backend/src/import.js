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

const loggerUtils = require('./logger');
const logger = loggerUtils.logger;
const readlines = require('n-readlines');
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
  name = utils.displayName(id);
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
  Interval.findByIdAndUpdate({
    _id: id
  }, {
    "$set": set,
    "$setOnInsert": {
      _id: id
    }
  }, {
    upsert: true,
    new: true
  }).then((interval, err) => {
    if (err) {
      logger.error(err, "ERROR: Trying to findByIdAndUpdate interval with %s", id);
      evoDb.terminate();
    }

    if (!interval) {
      logger.error("ERROR: Failed to find or create interval with id %s", id);
      evoDb.terminate();
    }

    findOrCreateIntervalParent(parent, interval);

  }).catch((err) => {
    logger.error("ERROR: " + err);
    evoDb.terminate();
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
  Topic.findOneAndUpdate({
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
  }).then((topic, err) => {
    if (err) {
      logger.error(err, "ERROR: Trying to findByOneAndUpdate description with %s", id);
      evoDb.terminate();
    }

    if (!topic) {
      logger.error("ERROR: Failed to find or create description with id %s", id);
      evoDb.terminate();
    }

  }).catch((err) => {
    logger.error("ERROR: " + err);
    evoDb.terminate();
  });
}

function createSubject(id, kind, category, from, to) {

  logger.debug("Creating subject: id: " + id + " kind: " + kind + " category: " + category + " from: " + from + " to: " + to);

  //
  // Ensure all whitespace is removed
  //
  id = id.trim();
  name = utils.displayName(id);
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
  Subject.findByIdAndUpdate({
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
  }).then((subject, err) => {
    if (err) {
      logger.error(err, "ERROR: Trying to findByIdAndUpdate subject with %s", id);
      evoDb.terminate();
    }

    if (!subject) {
      logger.error("ERROR: Failed to find or create subject with id %s", id);
      evoDb.terminate();
    }

  }).catch((err) => {
    logger.error("ERROR: " + err);
    evoDb.terminate();
  });
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
  Hint.findByIdAndUpdate({
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
  }).then((hint, err) => {
    if (err) {
      logger.error(err, "ERROR: Trying to findByIdAndUpdate hint with %s", id);
      evoDb.terminate();
    }

    if (!hint) {
      logger.error("ERROR: Failed to find or create hint with id %s", id);
      evoDb.terminate();
    }

  }).catch((err) => {
    logger.error("ERROR: " + err);
    evoDb.terminate();
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

    createHint(elements[0], elements[1], elements[2], elements[3], elements[4]);
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

module.exports = { importIntervals, importTopics, importHints, importSubjects };
