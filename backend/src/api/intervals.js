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
  Interval.find()
    .then(intervals => res.json(intervals))
    .catch(err => {
      logger.error("Failed to find any intervals", err);
      res.status(500).send(err);
    });
});

router.get('/:intervalId', (req, res) => {
  Interval.findById(
    { _id: req.params.intervalId }
  ).then(intervals => res.json(intervals))
   .catch(err => {
     logger.error("Failed to find interval id %s", req.params.intervalId, err);
     res.status(500).send(err);
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
      logger.error("Failed to find any children for interval %s", req.params.parentId, err);
      res.status(500).send(err);
    });

  }).catch(err => {
      logger.error(err);
      res.status(500).send(err);
    });
});

router.get('/description/:intervalId', (req, res) => {
  topic.description(res, 'Interval', req.params.intervalId);
});

module.exports = router;
