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
const Subject = require('../models/subject').Subject;
const mongoose = require('mongoose');
const path = require('path');
const topic = require('./topics');

// subjects api route
router.get('/', (req, res) => {
  let from = req.query.from;
  let to = req.query.to;

  if (!from) {
    from = -4600000000; // Earliest date of the pre-cambrian
  }

  if (!to) {
    to = new Date().getFullYear();
  }

  Subject.find({
    $or: [
      { to: {$gt: from, $lte: to} },                     // where to falls within range
      { from: {$gte: from, $lt: to} },                   // where from falls within range
      { $and: [{from: {$lte: from}}, {to: {$gte: to}}] } // where from->to is wider than range
    ]
  }).sort({ "category": 1, "from": 1, "to": 1 })
    .then(subjects => res.json(subjects))
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
