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

var mongoose = require('mongoose');

var Schema = mongoose.Schema;

var IntervalDescSchema = new Schema({
    interval: { type: String, ref: 'Interval', index: true },
    description: String,
    link: String
},
{ versionKey: 'version' });

// define our interval descrption model
module.exports = {
  IntervalDesc: mongoose.model('IntervalDesc', IntervalDescSchema)
};