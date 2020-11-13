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
const Topic = require('../models/topic').Topic;
const mongoose = require('mongoose');
const path = require('path');
const wiki = require("wikijs").default;
const loggerUtils = require('../logger');
const logger = loggerUtils.logger;

// topics api route
router.get('/', (req, res) => {
  Topic.find()
    .then(topics => res.json(topics))
    .catch(err => {
      logger.error("Failed to find any topics", err);
      res.status(500).send(err);
    });
});

router.get('/:topicType/:topicId', (req, res) => {
  Topic.find(
    { topic: req.params.topicId, topicTarget: req.params.topicType }
  ).then(topics => res.json(topics))
   .catch(err => {
     logger.error("Failed to find topic with id %s", req.params.topicId, err);
     res.status(500).send(err);
  });
});

const description = (res, type, id) => {
  Topic.findOne(
    { topic: id, topicTarget: type }
  )
  .then(topic => {
    if (topic == null) {
      res.status(500).send("Error: No topic with interval id " + id + " found");
      return;
    }

    if (topic.description && topic.description.length > 0) {
      res.json(topic);
      return;
    }

    logger.debug("Topic linkId: " + topic.linkId);
    wiki()
      .page(topic.linkId)
        .then(page => page.summary())
          .then(summary => {
            topic.description = summary;
            res.json(topic);

            //
            // Cache the description in the database
            //
            Topic.findByIdAndUpdate(
              { _id: topic._id, topicTarget: "Interval" },
              { "$set": { description : topic.description } },
              { upsert: true, new: true}
            ).then((desc, err) => {
              if (err) {
                logger.error(err);
                return;
              }

            }).catch((err) => {
              logger.error("Failed to update database with new summary", err);
            });
          })
          .catch(err => {
            logger.error("Failed to get wiki summary", err);
            res.status(500).send(err);
          });
  })
  .catch(err => {
    logger.error("Failed to find interval id " + req.params.intervalId, err);
    res.status(500).send(err);
  });
};

module.exports.router = router;
module.exports.description = description;
