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
const IntervalDesc = require('../models/intervaldesc').IntervalDesc;
const mongoose = require('mongoose');
const path = require('path');
const wiki = require("wikijs").default;

// intervals api route
router.get('/', (req, res) => {
  Interval.find()
    .then(intervals => res.json(intervals))
    .catch(err => {
      console.log(err);
      res.send(err);
    });
});

router.get('/:intervalId', (req, res) => {
  Interval.findById(
    { _id: req.params.intervalId }
  ).then(intervals => res.json(intervals))
   .catch(err => {
     console.log(err);
     res.send(err);
  });
});

router.get('/description/:intervalId', (req, res) => {
  IntervalDesc.findOne(
    { interval: req.params.intervalId }
  )
  .then(intervalDesc => {
    if (intervalDesc == null) {
      res.send("Error: No interval with id found");
      return;
    }

    if (intervalDesc.description && intervalDesc.description.length > 0) {
      console.log("Returning cached copy of summary");
      res.json(intervalDesc);
      return;
    }

    console.log("Fetching summary for the first time");
    wiki()
    .page(intervalDesc.linkId)
      .then(page => page.summary())
        .then(summary => {
          intervalDesc.description = summary;
          res.json(intervalDesc);

          //
          // Cache the description in the database
          //
          IntervalDesc.findByIdAndUpdate(
            { _id: intervalDesc._id },
            { "$set": { description : intervalDesc.description } },
            { upsert: true, new: true}
          ).then((desc, err) => {
            console.log("Updated description");
            if (err) {
              console.error("ERROR: Trying to findByIdAndUpdate interval description with %s: %s", intervalDesc._id, err);
              return;
            }

            console.log(desc);

          }).catch((err) => {
            console.error(err);
          });

        })
      .catch(err => {
        console.log(err);
        res.send(err);
      });
  })
  .catch(err => {
    console.log(err);
    res.send(err);
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
      console.log(err);
      res.send(err);
    });

  }).catch(err => {
      console.log(err);
      res.send(err);
    });
});

module.exports = router;
