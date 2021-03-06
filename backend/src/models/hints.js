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

var HintSchema = new Schema({
    _id: {type: String, required: true},
    type: String,
    colour: String,
},
{ versionKey: 'version' });

HintSchema.index({ name: 'text' });

// define our interval model
module.exports = {
  Hint: mongoose.model('Hint', HintSchema)
};
