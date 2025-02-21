/*
 * Copyright (C) 2023 Paul G. Richardson
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

import mongoose from 'mongoose'

const Schema = mongoose.Schema

export interface ITopic {
  topic: string,
  topicTarget: string,
  linkId?: string,
  description?: string // Empty by default but used to cache data as its queried
}

//
// topic:         id of a subject or interval
// topicTarget:   type of topic
// linkId:        identifier of the link
// description:   downloaded description from the linkId
//
export const TopicSchema = new Schema({
    topic: {
      type: String,
      required: true,
      refPath: 'topicTarget',
    },
    topicTarget: {
      type: String,
      required: true,
      enum: [ 'Interval', 'Subject' ]
    },
    linkId: String,
    description: String // Empty by default but used to cache data as its queried
},
{ versionKey: 'version' })

export const TopicModel = mongoose.model('Topic', TopicSchema)
