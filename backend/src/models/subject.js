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

const mongoose = require('mongoose');
const Hint = require('./hints').Hint;

const Schema = mongoose.Schema;

const SubjectSchema = new Schema({
    _id: {type: String, required: true},
    name: String,
    kind: {
      type: String,
      validate: {
        validator: function(v) {
          return Hint.findOne({
            _id: v,
            type: 'Kind'
          }).exec();
        },
        message: props => `${props.value} is an invalid Kind`
      }
    },
    category: {
      type: String,
      validate: {
        validator: function(v) {
          return Hint.findById(v);
        },
        message: props => `${props.value} is an invalid Category`
      },
      required: true
    },
    link: String,
    from: Number,
    to:   Number,
    icon: String,
    tags: [{
      type: String,
      validate: {
        validator: function(v) {
          return Hint.findById(v);
        },
        message: props => `${props.value} is an invalid Tag`
      },
    }],
},
{ versionKey: 'version' });

// Create index after import

// define our subject model
module.exports = {
  Subject: mongoose.model('Subject', SubjectSchema)
};
