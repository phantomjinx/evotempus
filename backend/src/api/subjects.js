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

const express = require('express');
const router = express.Router();
const Hint = require('../models/hints').Hint;
const Subject = require('../models/subject').Subject;
const mongoose = require('mongoose');
const path = require('path');
const topic = require('./topics');
const loggerUtils = require('../logger');
const logger = loggerUtils.logger;

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

function canAddSubjectToPage(page, subject) {
  let lanes = [];
  for (let i = 0; i < page.length; i++) {
    let lane = page[i];
    const overlaps = subjectOverlaps(lane, subject);
    if (! overlaps) {
      lanes.push(lane);
    }
  }

  return lanes;
}

function findAvailablePage(pages) {
  for (const page of pages) {
    if (page.length < laneMAX) {
      return page;
    }
  }

  const page = [];
  pages.push(page);
  return page;
}

function createPageLane(page, subject) {
  const lane = [];
  lane.push(subject);
  page.push(lane);
}

function addSubjectToPages(pages, subject) {
  const possLanes = [];
  for (const page of pages) {
    const lanes = canAddSubjectToPage(page, subject);
    for (const lane of lanes) {
      possLanes.push(lane);
    }
  }

  if (possLanes.length == 0) {
    const page = findAvailablePage(pages);
    createPageLane(page, subject);
  } else {
    let fullestLane = null;
    for (const lane of possLanes) {
      if (fullestLane == null || fullestLane.length < lane.length) {
        fullestLane = lane;
      }
    }
    fullestLane.push(subject);
  }
}

// subjects api route
router.get('/', async (req, res) => {
  let from = req.query.from;
  let to = req.query.to;
  let kind = req.query.kind;
  let page = req.query.page;

  if (!from) {
    from = -4600000000; // Earliest date of the pre-cambrian
  } else {
    from = parseInt(from);
  }

  if (!to) {
    to = new Date().getFullYear();
  } else {
    to = parseInt(to);
  }

  if (page < 1) {
    const err = new Error("The minimum value for 'page' is 1 rather than 0 and cannot be negative");
    logger.error(err);
    res.status(500).send(err);
    return;
  }

  let kinds = [];
  if (kind) {
    kinds.push({ _id: kind });
  } else {
    kinds = await Hint
      .find({ "type": "Kind" }, { "_id": 1 } )
      .exec();
  }

  //
  // {
  //   Event: {
  //     count: 1,
  //     pages: [...]
  //   }
  // }

  const kindResults = {};

  try {
    for (let i = 0; i < kinds.length; i++) {
      const kind = kinds[i]._id;
      const subjects = await Subject
        .aggregate([{
          $match: {
            $and: [
              { "kind": kind },
              { $or : [
                { to: {$gt: from, $lte: to} },                     // where to falls within range
                { from: {$gte: from, $lt: to} },                   // where from falls within range
                { $and: [
                  { from: { $lte: from } },
                  { to: { $gte: to } }
                ]} // where from->to is wider than range
              ]}
            ]}
          },
          { $addFields: { "range": { "$abs": { "$subtract": ["$from", "$to"] } } } },
          { $project: { "version" : 0 } },
          { $sort: { "range": -1 } }
        ])
        .exec();

      let pages = [];

      for (let i = 0; i < subjects.length; ++i) {
        const subject = subjects[i];
        addSubjectToPages(pages, subject);
      }

      // Filter the pages return based on page parameter
      if (page) {
        // page is defined as minimum of 1 as start so subtract 1 to get array position
        kindResults[kind] = { pages: pages.slice((page - 1), page) };
      } else {
        kindResults[kind] = { pages: pages };
      }

      kindResults[kind].count = pages.length;
    }

    res.json(kindResults);

  } catch(err) {
    console.log(err);
    res.status(500).send(err);
  }
});

router.get('/categories', (req, res) => {

  Subject.find({})
    .select({category: 1, _id: 0})
    .then(results => {
      const categories = new Set();
      for (const result of results.values()) {
        categories.add(result.category);
      }

      res.json(Array.from(categories));
    })
    .catch(err => {
      console.log(err);
      res.status(500).send(err);
    });
});

router.get('/:subjectId', (req, res) => {
  Subject.findById(
    { _id: req.params.subjectId }
    ).then(subjects => res.json(subjects))
    .catch(err => {
      console.log(err);
      res.status(500).send(err);
    });
});

router.get('/description/:subjectId', (req, res) => {
  topic.description(res, 'Subject', req.params.subjectId);
});

module.exports = router;
