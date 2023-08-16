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
import { Router } from 'express'
import { HydratedDocument } from 'mongoose'
import {
  IInterval, IntervalModel,
  ISubject, SubjectModel,
  ITopic, TopicModel } from '../models'
import { logger } from '../logger'
import createHttpError from 'http-errors'

interface SearchResult {
  intervals: HydratedDocument<IInterval>[],
  subjects: HydratedDocument<ISubject>[],
  topics: HydratedDocument<ITopic>[]
}

export const searchApi = Router()

// search api route
searchApi.get('/', async (req, res, next) => {

  if (! req.query.query) {
    next('No search query specified')
    return
  }

  const query = req.query.query as string
  if (query.length < 3) {
    next('Query text must be 3 or more characters')
    return
  }

  logger.info('Search: ' + query)

  try {
    const [intervals, subjects, topics] = await Promise.all([
      IntervalModel.find({
        $or: [
          { $text:       { $search: query } },
          { name:        { $regex: '.*' + query + '.*', $options: 'i' } }
        ]}).exec(),
      SubjectModel.find({
        $or: [
          { $text:       { $search: query } },
          { name:        { $regex: '.*' + query + '.*', $options: 'i' } },
          { tags:        { $regex: '.*' + query + '.*', $options: 'i' } }
        ]}).exec(),
      TopicModel.find({
        $or: [
          { $text:       { $search: query } },
          { topic:       { $regex: '.*' + query + '.*', $options: 'i' } },
          { topicTarget: { $regex: '.*' + query + '.*', $options: 'i' } },
          { description: { $regex: '.*' + query + '.*', $options: 'i' } }
        ]}).exec()
      ])

    const result: SearchResult = {
      intervals: [],
      subjects: [],
      topics: []
    }

    if (intervals.length === 0 && subjects.length === 0 && topics.length === 0) {
      res.json(result)
      return
    }

    if (intervals.length > 0) {
      result.intervals.push(...intervals)
    }
    if (subjects.length > 0) {
      result.subjects.push(...subjects)
    }
    if (topics.length > 0) {
      result.topics.push(...topics)
    }

    res.json(result)

  } catch(err) {
    const msg = `Error while performing search using query '${query}'`
    const wrapped = new Error(msg, { cause: err })
    logger.error(wrapped)
    next(createHttpError(wrapped))
  }
})
