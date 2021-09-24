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
const Interval = require('../models/interval').Interval;
const mongoose = require('mongoose');
const path = require('path');
const wiki = require("wikijs").default;
const topic = require('./topics');
const loggerUtils = require('../logger');
const logger = loggerUtils.logger;

// intervals api route
router.get('/', (req, res) => {

  const from = req.query.from;
  const to = req.query.to;
  const limited = req.query.limited;

  const filter = {};
  if (from && to) {
    filter.from = { $lte: from };
    filter.to = { $gte: to };
  } else if (from) {
    filter.from = { $lte: from };
  } else if (to) {
    filter.to = { $gte: to };
  }

  logger.debug("Intervals being run with filter: " + JSON.stringify(filter));

  Interval.find(
    filter,
    { version: 0 }
  ).then(intervals => {

    if (intervals.length <= 1) {
      res.json(intervals);
    } else if ((from || to) && limited === 'true') {
      //
      // Find the interval closest to the from and to
      //
      let theInterval = intervals[0];
      for (let i = 1; i < intervals.length; ++i) {
        const a = intervals[i];

        const d1 = theInterval.to - theInterval.from;
        const d2 = a.to - a.from;
        theInterval = d1 <= d2 ? theInterval : a;
      }

      res.json([theInterval]);
    } else {
      res.json(intervals);
    }
  }).catch(err => {
      const msg = "Failed to find any intervals";
      logger.error(err, msg);
      res.status(500).send(new Error(msg, err));
    });
});

router.get('/:intervalId', (req, res) => {
  Interval.findById(
    { _id: req.params.intervalId }
  ).then(intervals => res.json(intervals))
   .catch(err => {
     const msg = "Failed to find interval id " + req.params.intervalId;
     logger.error(err, msg);
     res.status(500).send(new Error(msg, err));
  });
});

router.get('/:parentId/children', (req, res) => {
  Interval.findById(
    { _id : req.params.parentId }
  ).then(interval => {

    //
    // Find the children of the interval
    //
    Interval.find(
      { _id :{ $in: interval.children }}
    ).then(children => {
      res.json(children);
    }).catch(err => {
      const msg = "Failed to find any children for interval " + req.params.parentId;
      logger.error(err, msg);
      res.status(500).send(new Error(msg, err));
    });

  }).catch(err => {
      const msg = "Failed to find interval id " + req.params.parentId;
      logger.error(err, msg);
      res.status(500).send(new Error(msg, err));
    });
});

router.get('/description/:intervalId', (req, res) => {
  topic.description(res, 'Interval', req.params.intervalId);
});

module.exports = router;
