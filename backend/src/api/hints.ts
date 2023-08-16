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
import { HintModel } from '../models'
import { logger } from '../logger'
import createHttpError from 'http-errors'

export const hintApi = Router()

// hints api route
hintApi.get('/', async (req, res, next) => {
  try {
    const hints = await HintModel.find().exec()
    res.json(hints)
  } catch(err) {
    const msg = 'Failed to find any hints'
    const wrapped = new Error(msg, { cause: err })
    logger.error(wrapped)
    next(createHttpError(wrapped))
  }
})
