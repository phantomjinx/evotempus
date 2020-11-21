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
const Subject = require('../models/subject').Subject;
const Topic = require('../models/topic').Topic;
const mongoose = require('mongoose');
const path = require('path');
const loggerUtils = require('../logger');
const logger = loggerUtils.logger;

// search api route
router.get('/', (req, res) => {

  if (! req.query.query) {
    res.status(500).send("Error: no search query specified");
  }

  logger.info("Search: " + req.query.query);

  Promise.all([
    Interval.find({ $text: { $search: req.query.query } }),
    Subject.find({ $text: { $search: req.query.query } }),
    Topic.find({ $text: { $search: req.query.query } })
  ]).then(answer => {

    const r = {
      intervals: [],
      subjects: [],
      topics: []
    };

    if (! answer || answer.length === 0) {
      res.json(r);
      return;
    }

    if (answer[0].length > 0) {
      r.intervals = answer[0];
    }
    if (answer[1].length > 0) {
      r.subjects = answer[1];
    }
    if (answer[2].length > 0) {
      r.topics = answer[2];
    }

    res.json(r);

  }).catch(err => {
    msg = "Error while performing search using query '" + req.query.query + "'";
    logger.error(err, msg);
    res.status(500).send(new Error(msg, err));
  });
});

module.exports = router;
