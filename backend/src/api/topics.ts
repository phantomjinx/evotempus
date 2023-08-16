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

import { NextFunction, Response, Router } from 'express'
import { TopicModel } from '../models'
import wiki from 'wikijs'
import { logger } from '../logger'
import createHttpError from 'http-errors'

export const topicApi = Router()

// topics api route
topicApi.get('/', async (req, res, next) => {
  try {
    const topics = await TopicModel.find().exec()
    res.json(topics)
  } catch(err) {
    const msg = 'Failed to find any topics'
    const wrapped = new Error(msg, { cause: err })
    logger.error(wrapped)
    next(createHttpError(wrapped))
  }
})

topicApi.get('/:topicType/:topicId', async (req, res, next) => {
  try {
    const types = ['Interval', 'Subject']
    if (! types.includes(req.params.topicType))
      throw new Error(`Topic type should be one of ${types}`)

    const topics = await TopicModel.find(
      { topic: req.params.topicId, topicTarget: req.params.topicType }
      ).exec()
    res.json(topics)
  } catch(err) {
    const msg = 'Failed to find topic with id ' + req.params.topicId
    const wrapped = new Error(msg, { cause: err })
    logger.error(wrapped)
    next(createHttpError(wrapped))
  }
})

export async function description(res: Response, next: NextFunction, type: string, id: string) {
  const topic = await TopicModel.findOne( { topic: id, topicTarget: type } )
  if (!topic) {
    next('No topic with interval id ' + id + ' found')
    return
  }

  if (topic.description && topic.description.length > 0) {
    res.json(topic)
    return
  }

  if (! topic.linkId) {
    next('No topic linkId available for interval id ' + id)
    return
  }

  logger.debug('Topic linkId: ' + topic.linkId)

  try {
    const page = await wiki().page(topic.linkId)
    const summary = await page.summary()
    topic.description = summary
    res.json(topic)
  } catch(err) {
    const msg = 'Failed to get wiki summary'
    const wrapped = new Error(msg, { cause: err })
    logger.error(wrapped)
    next(createHttpError(wrapped))
    return
  }

  //
  // Cache the description in the database
  //
  try {
    await TopicModel.findByIdAndUpdate(
      { _id: topic._id, topicTarget: 'Interval' },
      { '$set': { description : topic.description } },
      { upsert: true, new: true}).exec()
  }
  catch(err) {
    const msg = 'Failed to update database with new summary'
    const wrapped = new Error(msg, { cause: err })
    logger.error(wrapped)
    next(createHttpError(wrapped))
  }
}
