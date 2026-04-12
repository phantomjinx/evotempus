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
import { HintModel, ISubject, SubjectModel } from '../models'
import { logger } from '../logger'
import { description } from './topics'
import createHttpError from 'http-errors'

export const subjectApi = Router()

const laneMAX = 15

interface Lane {
  subjects: HydratedDocument<ISubject>[]
}

interface Page {
  lanes: Lane[]
}

type Pages = Page[]

interface KindResult {
  categories: string[],
  page: number,
  pages: Pages,
  count: number
}

interface KindResults {
  [indexer: string] : KindResult
}

function subjectOverlaps(lane: Lane, subject: HydratedDocument<ISubject>) {
  const buffer = Math.abs(0.01 * Math.max(subject.from, subject.to))

  for (let i = 0; i < lane.subjects.length; ++i) {
    const s = lane.subjects[i]
    if (!s) continue

    const bufferedFrom = subject.from - buffer
    const bufferedTo = subject.to + buffer

    if (bufferedTo > s.from && bufferedFrom <= s.to) {
      // where subject.to falls within s.range
      return true
    }

    if (bufferedFrom >= s.from && bufferedFrom < s.to) {
      // where subject.from falls within s.range
      return true
    }

    if (bufferedFrom <= s.from && bufferedTo >= s.to) {
      // where subject.range is wider than s.range
      return true
    }
  }

  return false
}

// subjects api route
subjectApi.post('/', async (req, res, next) => {
  try {
    if (!req.is('application/json'))
      throw new Error('/api/subjects must be a POST request with a contentType of application/json')

    const subjectId = req.body.subject
    const kind = req.body.kind
    const page = req.body.page
    let from = req.body.from
    let to = req.body.to
    let excluded = req.body.excluded

    if (!from) {
      from = -4600000000 // Earliest date of the pre-cambrian
    } else {
      from = parseInt(from)
    }

    if (!to) {
      to = new Date().getFullYear()
    } else {
      to = parseInt(to)
    }

    if (page && page < 1)
      throw new Error(`The minimum value for 'page' is 1 rather than 0 and cannot be negative`)

    let kinds = []
    if (kind) {
      kinds.push({ _id: kind })
    } else {
      kinds = await HintModel
        .find({ 'type': 'Kind' }, { '_id': 1 } )
        .exec()
    }

    if (! excluded) {
      excluded = []
    }

    //
    // {
    //   Event: {
    //     count: 1,
    //     pages: [...]
    //   }
    // }

    const kindResults: KindResults = {}

    for (const kindModel of kinds) {
      const kind: string = kindModel._id

      const kindResult: KindResult = {
        categories: [],
        page: 0,
        pages: [],
        count: 0
      }

      const subjects = await SubjectModel
        .aggregate([{
          $match: {
            $and: [
              { 'kind': kind },
              { $or : [
                { to: {$gt: from, $lte: to} },      // where to falls within range
                { from: {$gte: from, $lt: to} },    // where from falls within range
                { $and: [
                  { from: { $lte: from } },
                  { to: { $gte: to } }
                ]} // where from->to is wider than range
              ]}
            ]}
          },
          { $addFields: { 'range': { '$abs': { '$subtract': ['$from', '$to'] } } } },
          { $project: { 'version' : 0 } },
          { $sort: { 'category': 1, 'from': 1 } } // sort by category and then chronologically earliest
        ])
        .exec()

      // Group subjects by category and build the categories list
      const subjectsByCategory: Record<string, HydratedDocument<ISubject>[]> = {}

      for (const subject of subjects) {
        // Add all subject categories whether excluded or not
        if (! kindResult.categories.includes(subject.category)) {
          kindResult.categories.push(subject.category)
        }

        if (excluded.includes(subject.category))
          continue // do not include subject in data

        if (!subjectsByCategory[subject.category]) {
          subjectsByCategory[subject.category] = []
        }

        subjectsByCategory[subject.category]?.push(subject)
      }

      // Pack lanes optimally within each category block
      const allLanes: Lane[] = []
      for (const category of Object.keys(subjectsByCategory)) {
        const catSubjects = subjectsByCategory[category]
        if (!catSubjects) continue

        const categoryLanes: Lane[] = []
        for (const subject of catSubjects) {
          let placed = false

          // Try to slot into an existing lane for THIS category
          for (const lane of categoryLanes) {
            if (!subjectOverlaps(lane, subject)) {
              lane.subjects.push(subject)
              placed = true
              break
            }
          }

          // If it overlaps with everything, create a new lane
          if (!placed) {
            categoryLanes.push({ subjects: [subject] })
          }
        }

        // Append this category's tightly packed lanes to the master list
        allLanes.push(...categoryLanes)
      }

      // Chunk the lanes into Pages (15 lanes max per page)
      const pages: Pages = []
      for (let i = 0; i < allLanes.length; i += laneMAX) {
        pages.push({ lanes: allLanes.slice(i, i + laneMAX) })
      }

      // Find the subjectPageIdx if a specific subject was requested
      let subjectPageIdx = -1
      if (subjectId) {
        pages.forEach((page, pIdx) => {
          for (const lane of page.lanes) {
            if (lane.subjects.some(s => s._id.toString() === subjectId)) {
              subjectPageIdx = pIdx
            }
          }
        })
      }

      //
      // Filter the pages return based on page or subject parameters
      // If page is defined then drop subject
      // If page not defined then try and return page with subject
      //
      console.log(`Returning subject query - kind: ${kind} page: ${page} subjectId: ${subjectId} subjectPageIdx: ${subjectPageIdx}`)
      if (page) {
        console.log('Page Defined')
        // page is defined as minimum of 1 as start so subtract 1 to get array position
        // kindResult.pages = pages.slice((page - 1), page)
        kindResult.pages = pages
        kindResult.page = parseInt(page)
      } else if (subjectId && subjectPageIdx >= 0) {
        console.log("Subject defined so return specific page")
        // kindResult.pages = pages.slice(subjectPageIdx, subjectPageIdx + 1)
        kindResult.pages = pages
        kindResult.page = (subjectPageIdx + 1)
      } else {
        console.log('Page NOT defined and subjectId not defined and subjectPageIdx < 0')
        kindResult.pages = pages
        kindResult.page = 1
      }

      kindResult.count = kindResult.pages.length
      kindResults[kind] = kindResult
    }

    res.json(kindResults)

  } catch(err) {
    const msg = 'Failed to find subjects'
    const wrapped = new Error(msg, { cause: err })
    logger.error(wrapped)
    next(createHttpError(wrapped))
  }
})

subjectApi.get('/categories', async (req, res, next) => {
  try {
    const subjects = await SubjectModel.find({}).select({category: 1, _id: 0}).exec()
    if (!subjects) {
      res.json([])
      return
    }

    const categories = new Set()
    for (const subject of subjects) {
      categories.add(subject.category)
    }

    res.json(Array.from(categories))
  } catch(err) {
    const msg = 'Failed to find subject categories'
    const wrapped = new Error(msg, { cause: err })
    logger.error(wrapped)
    next(createHttpError(wrapped))
  }
})

subjectApi.get('/:subjectId', async (req, res, next) => {
  try {
    const subjects = await SubjectModel.findById({ _id: req.params.subjectId }).exec()
    res.json(subjects)
  } catch(err) {
    const msg = 'Failed to find subject'
    const wrapped = new Error(msg, { cause: err })
    logger.error(wrapped)
    next(createHttpError(wrapped))
  }
})

subjectApi.get('/description/:subjectId', (req, res, next) => {
  return description(res, next, 'Subject', req.params.subjectId)
})
