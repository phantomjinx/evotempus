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
const mongoose = require('mongoose');
const loggerUtils = require('../logger');
const logger = loggerUtils.logger;

// hints api route
router.get('/', (req, res) => {
  Hint.find()
    .then(hints => res.json(hints))
    .catch(err => {
      const msg = "Failed to find any hints";
      logger.error(err, msg);
      res.status(500).send(new Error(msg, err));
    });
});

module.exports = router;
