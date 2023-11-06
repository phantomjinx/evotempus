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

 /* jshint node: true */
 'use strict'

import { HydratedDocument } from 'mongoose'
import { logger } from './logger'
import fs from 'fs'
import path from 'path'
import readlines from 'n-readlines'
import * as utils from './utils'

import { evoDb } from './connection'
import {
  ISubject, SubjectModel,
  IInterval, IntervalModel,
  TopicModel, HintModel, IHint } from './models'

export interface ImportStats {
  intervals: number,
  hints: number,
  topics: number,
  subjects: number,
  ignoredSubjects: number
}

const stats: ImportStats = {
  intervals: 0,
  hints: 0,
  topics: 0,
  subjects: 0,
  ignoredSubjects: 0
}

type ImportFn = ((dataRow: string[], minimumCols: number) => Promise<void>)

function isString(value: unknown): value is string {
  return typeof value === 'string'
}

function expectPopulated(dataArr: string[], dataType: string, expectedSize: number) {
  try {
    if (dataArr.length < expectedSize) {
      throw new Error(`ERROR: Number of ${dataType} columns in data is less than expected: [${dataArr}]: { actual: ${dataArr.length}, expected: ${expectedSize} }`)
    }

    for (let i = 0; i < expectedSize; ++i) {
      if (! isString(dataArr[i]))
        throw new Error(`ERROR: Cannot create ${dataType}: data is not populated: ${dataArr}`)
    }
  } catch (err) {
    logger.error(err)
    evoDb.terminate()
  }
}

export async function createInterval(dataRow: string[], minimumCols: number) {
  expectPopulated(dataRow, 'interval', minimumCols)

  const id = utils.trim(dataRow[0])
  const name = utils.displayName(id)
  const kind = utils.trim(dataRow[1])
  const from = utils.parseNumber(utils.trim(dataRow[2]), id)
  const to = utils.parseNumber(utils.trim(dataRow[3]), id)
  const parent = utils.trim(dataRow[4])

  let children: string[] = []
  if (dataRow.length > 5 && isString(dataRow[5])) {
    children = dataRow[5].split(',')
    //
    // Check the children for empty dataRow
    //
    const c = []
    for (let i = 0; i < children.length; i++) {
      let childData = children[i] || ''
      childData = childData.trim()

      if (childData.length > 0) {
        c.push(childData)
      }
    }
    children = c
  }

  const existing = await IntervalModel.findById(id).exec()
  if (existing) return

  const set: IInterval = {
    _id: id,
    name: name,
    kind: kind,
    from: from,
    to: to,
    parent: parent
  }

  //
  // Only insert a children array if not empty
  //
  if (children.length > 0) {
    set.children = children
  }

  // New interval
  const newInterval = new IntervalModel(set)
  await newInterval.save()

  stats.intervals++
}

export async function createTopic(dataRow: string[], topicTgt: string, minimumCols: number) {
  expectPopulated(dataRow, 'topic', minimumCols)

  //
  // Ensure all whitespace is removed
  //
  const topicId = utils.trim(dataRow[0])
  const linkId = utils.trim(dataRow[1])
  topicTgt = topicTgt.trim()

  const existing = await TopicModel.findOne({topic: topicId}).exec()
  if (existing) return

  // New id subject
  const newTopic = new TopicModel({
    topic: topicId,
    linkId: linkId,
    topicTarget: topicTgt
  })
  await newTopic.save()

  stats.topics++
}

export async function createIntervalTopic(dataRow: string[], minimumCols: number) {
  createTopic(dataRow, 'Interval', minimumCols)
}

export async function createSubjectTopic(dataRow: string[], minimumCols: number) {
  createTopic(dataRow, 'Subject', minimumCols)
}

export async function createSubject(
  id: string, name: string, kind: string, category: string,
  from: number, to: number, linkId: string, tags: string[]) {

  if (id === 'NO_GENUS_SPECIFIED') {
    logger.debug('Ignoring row with no genus: %s %s %s %s %d %d', id, name, kind, category, from, to)
    return
  }

  if (category === 'Problematica') {
    logger.debug('Ignoring row with problematic phylum: %s %s %s %s %d %d', id, name, kind, category, from, to)
    return
  }

  logger.debug('Creating subject: id: ' + id + ' kind: ' + kind + ' category: ' + category + ' from: ' + from + ' to: ' + to + ' tags: ' + tags.toString())

  tags = tags.filter((item) => item.length === 0)

  // New id subject
  const newSubject = new SubjectModel({
    _id: id,
    name: name,
    kind: kind,
    category: category,
    from: from,
    to: to,
    tags: tags
  })

  await newSubject.save()
  await createSubjectTopic([id, linkId], 2)

  stats.subjects++
}

export async function updateSubject(
  subject: HydratedDocument<ISubject>, id: string, name: string, kind: string,
  category: string, from: number, to: number, tags: string[]) {

  logger.debug('Updating subject: id: ' + id + ' kind: ' + kind + ' category: ' + category + ' from: ' + from + ' to: ' + to + ' tags: ' + tags.toString())

  // Subject exists so need to check and update
  if (subject.name !== name) {
    logger.error('ERROR: The subject %s being imported has name %s but existing subject has name %s', id, name, subject.name)
    evoDb.terminate()
  }

  if (subject.kind !== kind) {
    logger.error('ERROR: The subject %s being imported has kind %s but existing subject has kind %s', id, kind, subject.kind)
    evoDb.terminate()
  }

  if (subject.category !== category) {
    logger.error('ERROR: The subject %s being imported has category %s but existing subject has category %s', id, category, subject.category)
    evoDb.terminate()
  }

  // Determine widest time span possible
  if (from < subject.from) {
    subject.from = from
  }

  if (to > subject.to) {
    subject.to = to
  }

  if (tags.length > 0) {
    const dTags = tags.concat(subject.tags)
    subject.tags = dTags.filter((item, pos) => {
      return item.length === 0 || dTags.indexOf(item) === pos
    })
  }

  await subject.save()
}

export async function createOrUpdateSubject(dataRow: string[], minimumCols: number) {
  expectPopulated(dataRow, 'subject', minimumCols)

  const id = utils.trim(dataRow[0])
  const name = utils.displayName(id)
  const kind = utils.trim(dataRow[1])
  const category = utils.trim(dataRow[2])
  const from = utils.parseNumber(utils.trim(dataRow[3]), id)
  const to = utils.parseNumber(utils.trim(dataRow[4]), id)
  const linkId = utils.trim(dataRow[5])

  let tags: string[] = []
  if (dataRow.length > 6) {
    const tagStr = utils.trim(dataRow[6])
    if (! utils.noValue(tagStr)) {
      tags = tagStr.split(',')
    }
  }

  if (utils.noValue(linkId)) {
    stats.ignoredSubjects++
    return // Only import subjects with a wikipedia link id
  }

  const subject = await SubjectModel.findById(id).exec()
  if (!subject) {
    await createSubject(id, name, kind, category, from, to, linkId, tags)
  } else {
    await updateSubject(subject, id, name, kind, category, from, to, tags)
  }
}

export async function tagSubject(dataRow: string[], minimumCols: number) {
  expectPopulated(dataRow, 'tag', minimumCols)

  const subjectId = utils.trim(dataRow[0])
  const tagId = utils.trim(dataRow[1])

  logger.debug('Tagging subject: id: ' + subjectId + ' tag: ' + tagId)

  const subject = await SubjectModel.findById(subjectId).exec()
  if (!subject) {
    logger.error('ERROR: Cannot find subject ' + subjectId + ' while tagging')
    evoDb.terminate()
  }

  const tags = subject?.tags || []
  if (tags?.indexOf(tagId) < 0) {
    subject?.tags.push(tagId)

    //
    // Validator of subject should detect whether tag is valid
    //
    await subject?.save()
  }
}

export async function createHint(dataRow: string[], minimumCols: number) {
  expectPopulated(dataRow, 'hint', minimumCols)

  const calcOrder = (orderStr: string, id: string): number => {
    let order = 0
    if (! utils.noValue(orderStr)) {
      order = utils.parseNumber(orderStr, id)
    }
    return order
  }

  //
  // Ensure all whitespace is removed
  //
  const id = utils.trim(dataRow[0])

  const existing = await HintModel.findById(id).exec()
  if (existing) return

  const set: IHint = {
    _id: id,
    type: utils.trim(dataRow[1]),
    parent: utils.replaceNoValue(dataRow[2]),
    colour: utils.replaceNoValue(dataRow[3]),
    link: utils.replaceNoValue(dataRow[4]),
    order: calcOrder(utils.trim(dataRow[5]), id)
  }

  logger.debug(`Creating hint`)
  logger.debug(set)

  // New Hint
  const newHint = new HintModel(set)
  await newHint.save()

  stats.hints++
}

export async function importReader(path: string, minimumCols: number, importFn: ImportFn) {
  logger.debug('INFO: Starting importing data from ' + path)

  const liner = new readlines(path)

  let next
  while ((next = liner.next()) !== false) { // jshint ignore:line
    const line = next.toString('ascii')

    if (line.startsWith('#') || line.length == 0) {
      continue
    }

    const dataRow = line.split('|')
    if (dataRow.length < minimumCols) {
      logger.error('ERROR: Number of columns in record is smaller than expected: ' + line)
      evoDb.terminate()
    }

    await importFn(dataRow, minimumCols)
  }

  logger.debug('INFO: Completed importing data from ' + path)
}

export async function importContent(pathOrPaths: string|string[], minimumCols: number, importFn: ImportFn) {
  let paths: string[] = []
  if (Array.isArray(pathOrPaths)) {
    paths = paths.concat(pathOrPaths)
  } else {
    paths.push(pathOrPaths)
  }

  logger.debug(`Import path: ${paths}`)

  for (let i = 0; i < paths.length; i++) {
    const fullPath = path.resolve(__dirname, '..', paths[i] as string)

    if (fs.statSync(fullPath).isDirectory()) {
      const files = fs.readdirSync(fullPath)

      for (let j = 0; j < files.length; j++) {
        const file = files[j] as string

        if (path.extname(file) === '.dat') {
          await importReader(path.resolve(fullPath, file), minimumCols, importFn)
        }
      }
    } else {
      await importReader(fullPath, minimumCols, importFn)
    }
  }
}

export async function importIntervals(pathOrPaths: string|string[]) {
  await importContent(pathOrPaths, 6, createInterval)
  logger.debug('INFO: import of intervals complete')
}

export async function importIntervalTopics(pathOrPaths: string|string[]) {
  await importContent(pathOrPaths, 2, createIntervalTopic)
  logger.debug('INFO: import of topics complete')
}

export async function importHints(pathOrPaths: string|string[]) {
  await importContent(pathOrPaths, 7, createHint)
  logger.debug('INFO: import of hints complete')
}

export async function importSubjects(pathOrPaths: string|string[]) {
  await importContent(pathOrPaths, 6, createOrUpdateSubject)
  logger.debug('INFO: import of subjects complete')
}

export async function importTags(pathOrPaths: string|string[]) {
  await importContent(pathOrPaths, 2, tagSubject)
}

export function reportStats() {
  logger.info('*** Intervals: %d  Topics: %d  Hints: %d  Subjects: %d  Ignored Subjects: %d ***',
   stats.intervals, stats.topics, stats.hints, stats.subjects, stats.ignoredSubjects)
}
