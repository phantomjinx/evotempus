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

function ImportStats() {
  this.intervals = 0;
  this.hints = 0;
  this.topics = 0;
  this.subjects = 0;
  this.ignoredSubjects = 0;
}

var stats = new ImportStats();

async function createInterval(dataRow) {
  if (dataRow.length < 5) {
    logger.error("ERROR: Cannot create interval as number of columns in data is smaller than expected: %s", dataRow[0]);
    evoDb.terminate();
  }

  const id = dataRow[0].trim();
  const name = utils.displayName(id);
  const kind = dataRow[1].trim();
  const from = utils.parseNumber(dataRow[2], id);
  const to = utils.parseNumber(dataRow[3], id);
  const parent = dataRow[4].trim();

  let children = [];
  if (dataRow.length > 5) {
    children = dataRow[5].split(",");
    //
    // Check the children for empty dataRow
    //
    var c = [];
    for (let i = 0; i < children.length; i++) {
      children[i] = children[i].trim();
      if (children[i].length > 0) {
        c.push(children[i]);
      }
    }
    children = c;
  }

  //
  // Only insert a children array if not empty
  //
  var set = {
    name: name,
    kind: kind,
    from: from,
    to: to,
    parent: parent
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
  }).exec();

  stats.intervals++;
}

async function createTopic(dataRow, topicTgt) {
  if (dataRow.length < 2) {
    logger.error("ERROR: Cannot create topic as number of columns in data is smaller than expected: %s", dataRow[0]);
    evoDb.terminate();
  }

  //
  // Ensure all whitespace is removed
  //
  const id = dataRow[0].trim();
  const linkId = dataRow[1].trim();
  topicTgt = topicTgt.trim();

  //
  // Automatically deduplicates
  //
  await Topic.findOneAndUpdate({
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

  stats.topics++;
}

async function createIntervalTopic(dataRow) {
  createTopic(dataRow, "Interval");
}

async function createSubjectTopic(dataRow) {
  createTopic(dataRow, "Subject");
}

async function createSubject(id, name, kind, category, from, to, linkId) {

  if (id === "NO_GENUS_SPECIFIED") {
    logger.debug("Ignoring row with no genus: %s %s %s %s %d %d", id, name, kind, category, from, to);
    return;
  }

  if (category === "Problematica") {
    logger.debug("Ignoring row with problematic phylum: %s %s %s %s %d %d", id, name, kind, category, from, to);
    return;
  }

  logger.debug("Creating subject: id: " + id + " kind: " + kind + " category: " + category + " from: " + from + " to: " + to);

  // New id subject
  var new_subject = new Subject({
    _id: id,
    name: name,
    kind: kind,
    category: category,
    from: from,
    to: to
  });
  await new_subject.save();
  await createSubjectTopic([id, linkId]);

  stats.subjects++;
}

async function updateSubject(subject, id, name, kind, category, from, to) {

  logger.debug("Updating subject: id: " + id + " kind: " + kind + " category: " + category + " from: " + from + " to: " + to);

  // Subject exists so need to check and update
  if (subject.name !== name) {
    logger.error("ERROR: The subject %s being imported has name %s but existing subject has name %s", id, name, subject.name);
    evoDb.terminate();
  }

  if (subject.kind !== kind) {
    logger.error("ERROR: The subject %s being imported has kind %s but existing subject has kind %s", id, kind, subject.kind);
    evoDb.terminate();
  }

  if (subject.category !== category) {
    logger.error("ERROR: The subject %s being imported has category %s but existing subject has category %s", id, category, subject.category);
    evoDb.terminate();
  }

  // Determine widest time span possible
  if (from < subject.from) {
    subject.from = from;
  }

  if (to > subject.to) {
    subject.to = to;
  }

  await subject.save();
}

async function createOrUpdateSubject(dataRow) {
  if (dataRow.length < 6) {
    logger.error("ERROR: Cannot create or update subject as number of columns in data is smaller than expected: %s", dataRow[0]);
    evoDb.terminate();
  }

  const id = dataRow[0].trim();
  const name = utils.displayName(id);
  const kind = dataRow[1].trim();
  const category = dataRow[2].trim();
  const from = utils.parseNumber(dataRow[3], id);
  const to = utils.parseNumber(dataRow[4], id);
  const linkId = dataRow[5].trim();

  if (utils.valueUnknown(linkId)) {
    stats.ignoredSubjects++;
    return; // Only import subjects with a wikipedia link id
  }

  const subject = await Subject.findById(id).exec();
  if (subject == null) {
    await createSubject(id, name, kind, category, from, to, linkId);
  } else {
    await updateSubject(subject, id, name, kind, category, from, to);
  }
}

async function createHint(dataRow) {
  if (dataRow.length < 5) {
    logger.error("ERROR: Cannot create hint as number of columns in data is smaller than expected: %s", dataRow[0]);
    evoDb.terminate();
  }

  //
  // Ensure all whitespace is removed
  //
  const id = dataRow[0].trim();
  const type = dataRow[1].trim();
  let parent = dataRow[2].trim();
  let colour = dataRow[3].trim();
  let link = dataRow[4].trim();
  let order = dataRow[5].trim();

  if (parent == "<>") {
    parent = "";
  }

  if (utils.valueUnknown(colour)) {
    colour = "";
  }

  if (utils.valueUnknown(link)) {
    link = "";
  }

  if (utils.valueUnknown(order)) {
    order = 0;
  } else {
    order = utils.parseNumber(order, id);
  }

  logger.debug("Creating hint: id: " + id + " type: " + type + " parent: " + parent + " colour: " + colour + " link: " + link + " order: " + order);

  //
  // Automatically deduplicates and finish in its own time
  //
  await Hint.findByIdAndUpdate({
    _id: id
  }, {
    "$set": {
      type: type,
      parent: parent,
      colour: colour,
      link: link,
      order: order
    },
    "$setOnInsert": {
      _id: id
    }
  }, {
    upsert: true,
    new: true
  }).exec();

  stats.hints++;
}

async function importReader(path, expectedCols, importFn) {
  logger.debug("INFO: Starting importing data from " + path);

  const liner = new readlines(path);

  let next;
  while (next = liner.next()) { // jshint ignore:line
    const line = next.toString('ascii');

    if (line.startsWith("#") || line.length == 0) {
      continue;
    }

    const dataRow = line.split('|');
    if (dataRow.length < expectedCols) {
      logger.error("ERROR: Number of columns in record is smaller than expected: " + line);
      evoDb.terminate();
    }

    await importFn(dataRow);
  }

  logger.debug("INFO: Completed importing data from " + path);
}

async function importContent(pathOrPaths, expectedCols, importFn) {
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
      for (let j = 0; j < files.length; j++) {
        if (pathlib.extname(files[j]) == ".dat") {
          await importReader(pathlib.resolve(fullPath, files[j]), expectedCols, importFn);
        }
      }
    } else {
      await importReader(fullPath, expectedCols, importFn);
    }
  }
}

async function importIntervals(pathOrPaths) {
  await importContent(pathOrPaths, 5, createInterval);
  logger.debug("INFO: import of intervals complete");
}

async function importIntervalTopics(pathOrPaths) {
  await importContent(pathOrPaths, 2, createIntervalTopic);
  logger.debug("INFO: import of topics complete");
}

async function importHints(pathOrPaths) {
  await importContent(pathOrPaths, 5, createHint);
  logger.debug("INFO: import of hints complete");
}

async function importSubjects(pathOrPaths) {
  await importContent(pathOrPaths, 6, createOrUpdateSubject);
  logger.debug("INFO: import of subjects complete");
}

function reportStats() {
  logger.info("*** Intervals: %d  Topics: %d  Hints: %d  Subjects: %d  Ignored Subjects: %d ***",
   stats.intervals, stats.topics, stats.hints, stats.subjects, stats.ignoredSubjects);
}

module.exports = { importIntervals, importIntervalTopics, importHints, importSubjects, reportStats};
