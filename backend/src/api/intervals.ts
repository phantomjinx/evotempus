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
import { IInterval, IntervalModel } from '../models'
import { logger } from '../logger'
import { description } from './topics'
import { HydratedDocument } from 'mongoose'
import createHttpError from 'http-errors'

export const intervalApi = Router()

interface Filter {
  from?: Record<string, string>
  to?: Record<string, string>
}

// intervals api route
intervalApi.get('/', async (req, res, next) => {

  const from = req.query.from as string
  const to = req.query.to as string
  const limited = req.query.limited

  const filter: Filter = {}

  if (from && to) {
    filter.from = { $lte: from }
    filter.to = { $gte: to }
  } else if (from) {
    filter.from = { $lte: from }
  } else if (to) {
    filter.to = { $gte: to }
  }

  logger.debug('Intervals being run with filter: ' + JSON.stringify(filter))

  try {
    const intervals = await IntervalModel.find(filter, { version: 0 }).exec()
    if (intervals.length <= 1) {
      res.json(intervals)
    } else if ((from || to) && limited === 'true') {
      //
      // Find the interval closest to the from and to
      //
      let theInterval = intervals[0] as HydratedDocument<IInterval>
      for (let i = 1; i < intervals.length; ++i) {
        const a = intervals[i] as HydratedDocument<IInterval>
        const d1 = theInterval.to - theInterval.from
        const d2 = a.to - a.from
        theInterval = d1 <= d2 ? theInterval : a
      }

      res.json([theInterval])
    } else {
      res.json(intervals)
    }
  } catch(err) {
    const msg = 'Failed to find any intervals'
    const wrapped = new Error(msg, { cause: err })
    logger.error(wrapped)
    next(createHttpError(wrapped))
  }
})

intervalApi.get('/:intervalId', async (req, res, next) => {
  try {
    const intervals = await IntervalModel.findById({ _id: req.params.intervalId }).exec()
    res.json(intervals)
  } catch(err) {
    const msg = 'Failed to find interval id ' + req.params.intervalId
    const wrapped = new Error(msg, { cause: err })
    logger.error(wrapped)
    next(createHttpError(wrapped))
  }
})

intervalApi.get('/:parentId/children', async (req, res, next) => {
  try {
    const interval = await IntervalModel.findById({ _id : req.params.parentId }).exec()
    if (!interval) {
      const msg = 'Failed to find interval ' + req.params.parentId
      throw new Error(msg)
    }

    //
    // Find the children of the interval
    //
    const children = await IntervalModel.find({ _id :{ $in: interval.children }}).exec()
    res.json(children)
  } catch(err) {
    const msg = 'Failed to find any children for interval ' + req.params.parentId
    const wrapped = new Error(msg, { cause: err })
    logger.error(wrapped)
    next(createHttpError(wrapped))
  }
})

intervalApi.get('/description/:intervalId', async (req, res, next) => {
  return await description(res, next, 'Interval', req.params.intervalId)
})
