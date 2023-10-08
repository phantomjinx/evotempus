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
  TopicModel, HintModel } from './models'

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

type ImportFn = ((dataRow: string[]) => Promise<void>)

function isString(value: unknown): value is string {
  return typeof value === 'string'
}

function expectPopulated(dataArr: string[], dataType: string, expectedSize: number) {
  try {
    if (dataArr.length !== expectedSize) {
      throw new Error(`ERROR: Number of ${dataType} columns in data is smaller than expected: ${dataArr}`)
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

export async function createInterval(dataRow: string[]) {
  expectPopulated(dataRow, 'interval', 5)

  const id = (dataRow[0] as string).trim()
  const name = utils.displayName(id)
  const kind = (dataRow[1] as string).trim() as string
  const from = utils.parseNumber(dataRow[2] as string, id)
  const to = utils.parseNumber(dataRow[3] as string, id)
  const parent = (dataRow[4] as string).trim()

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

  //
  // Only insert a children array if not empty
  //
  const set: IInterval = {
    _id: id,
    name: name,
    kind: kind,
    from: from,
    to: to,
    parent: parent
  }

  if (children.length > 0) {
    set.children = children
  }

  //
  // Automatically deduplicates
  //
  IntervalModel.findByIdAndUpdate({
    _id: id
  }, {
    '$set': set,
    '$setOnInsert': {
      _id: id
    }
  }, {
    upsert: true,
    new: true
  }).exec()

  stats.intervals++
}

export async function createTopic(dataRow: string[], topicTgt: string) {
  expectPopulated(dataRow, 'topic', 2)

  //
  // Ensure all whitespace is removed
  //
  const id = (dataRow[0] as string).trim()
  const linkId = (dataRow[1] as string).trim()
  topicTgt = topicTgt.trim()

  //
  // Automatically deduplicates
  //
  await TopicModel.findOneAndUpdate({
    topic: id
  }, {
    '$set': {
      linkId: linkId,
      topicTarget: topicTgt
    },
    '$setOnInsert': {
      topic: id
    }
  }, {
    upsert: true,
    new: true
  }).exec()

  stats.topics++
}

export async function createIntervalTopic(dataRow: string[]) {
  createTopic(dataRow, 'Interval')
}

export async function createSubjectTopic(dataRow: string[]) {
  createTopic(dataRow, 'Subject')
}

export async function createSubject(
  id: string, name: string, kind: string, category: string,
  from: number, to: number, linkId: string) {

  if (id === 'NO_GENUS_SPECIFIED') {
    logger.debug('Ignoring row with no genus: %s %s %s %s %d %d', id, name, kind, category, from, to)
    return
  }

  if (category === 'Problematica') {
    logger.debug('Ignoring row with problematic phylum: %s %s %s %s %d %d', id, name, kind, category, from, to)
    return
  }

  logger.debug('Creating subject: id: ' + id + ' kind: ' + kind + ' category: ' + category + ' from: ' + from + ' to: ' + to)

  // New id subject
  const new_subject = new SubjectModel({
    _id: id,
    name: name,
    kind: kind,
    category: category,
    from: from,
    to: to
  })
  await new_subject.save()
  await createSubjectTopic([id, linkId])

  stats.subjects++
}

export async function updateSubject(
  subject: HydratedDocument<ISubject>, id: string, name: string, kind: string,
  category: string, from: number, to: number) {

  logger.debug('Updating subject: id: ' + id + ' kind: ' + kind + ' category: ' + category + ' from: ' + from + ' to: ' + to)

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

  await subject.save()
}

export async function createOrUpdateSubject(dataRow: string[]) {
  expectPopulated(dataRow, 'subject', 6)

  const id = (dataRow[0] as string).trim() as string
  const name = utils.displayName(id)
  const kind = (dataRow[1] as string).trim() as string
  const category = (dataRow[2] as string).trim()
  const from = utils.parseNumber(dataRow[3] as string, id)
  const to = utils.parseNumber(dataRow[4] as string, id)
  const linkId = (dataRow[5] as string).trim()

  if (utils.valueUnknown(linkId)) {
    stats.ignoredSubjects++
    return // Only import subjects with a wikipedia link id
  }

  const subject = await SubjectModel.findById(id).exec()
  if (subject == null) {
    await createSubject(id, name, kind, category, from, to, linkId)
  } else {
    await updateSubject(subject, id, name, kind, category, from, to)
  }
}

export async function tagSubject(dataRow: string[]) {
  expectPopulated(dataRow, 'tag', 2)

  const subjectId = (dataRow[0] as string).trim()
  const tagId = (dataRow[1] as string).trim()

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
    // Vaidator of subject should detect whether tag is valid
    //
    await subject?.save()
  }
}

export async function createHint(dataRow: string[]) {
  expectPopulated(dataRow, 'hint', 5)

  //
  // Ensure all whitespace is removed
  //
  const id = (dataRow[0] as string).trim()
  const type = (dataRow[1] as string).trim()
  let parent = (dataRow[2] as string).trim()
  let colour = (dataRow[3] as string).trim()
  let link = (dataRow[4] as string).trim()
  const orderStr = (dataRow[5] || '').trim()

  if (parent == '<>') {
    parent = ''
  }

  if (utils.valueUnknown(colour)) {
    colour = ''
  }

  if (utils.valueUnknown(link)) {
    link = ''
  }

  let order = 0
  if (! utils.valueUnknown(orderStr)) {
    order = utils.parseNumber(orderStr, id)
  }

  logger.debug('Creating hint: id: ' + id + ' type: ' + type + ' parent: ' + parent + ' colour: ' + colour + ' link: ' + link + ' order: ' + order)

  //
  // Automatically deduplicates and finish in its own time
  //
  await HintModel.findByIdAndUpdate({
    _id: id
  }, {
    '$set': {
      type: type,
      parent: parent,
      colour: colour,
      link: link,
      order: order
    },
    '$setOnInsert': {
      _id: id
    }
  }, {
    upsert: true,
    new: true
  }).exec()

  stats.hints++
}

export async function importReader(path: string, expectedCols: number, importFn: ImportFn) {
  logger.debug('INFO: Starting importing data from ' + path)

  const liner = new readlines(path)

  let next
  while ((next = liner.next()) !== false) { // jshint ignore:line
    const line = next.toString('ascii')

    if (line.startsWith('#') || line.length == 0) {
      continue
    }

    const dataRow = line.split('|')
    if (dataRow.length < expectedCols) {
      logger.error('ERROR: Number of columns in record is smaller than expected: ' + line)
      evoDb.terminate()
    }

    await importFn(dataRow)
  }

  logger.debug('INFO: Completed importing data from ' + path)
}

export async function importContent(pathOrPaths: string|string[], expectedCols: number, importFn: ImportFn) {
  let paths: string[] = []
  if (Array.isArray(pathOrPaths)) {
    paths = paths.concat(pathOrPaths)
  } else {
    paths.push(pathOrPaths)
  }

  for (let i = 0; i < paths.length; i++) {
    const fullPath = path.resolve(__dirname, '..', paths[i] as string)

    if (fs.statSync(fullPath).isDirectory()) {
      const files = fs.readdirSync(fullPath)

      for (let j = 0; j < files.length; j++) {
        const file = files[j] as string

        if (path.extname(file) === '.dat') {
          await importReader(path.resolve(fullPath, file), expectedCols, importFn)
        }
      }
    } else {
      await importReader(fullPath, expectedCols, importFn)
    }
  }
}

export async function importIntervals(pathOrPaths: string|string[]) {
  await importContent(pathOrPaths, 5, createInterval)
  logger.debug('INFO: import of intervals complete')
}

export async function importIntervalTopics(pathOrPaths: string|string[]) {
  await importContent(pathOrPaths, 2, createIntervalTopic)
  logger.debug('INFO: import of topics complete')
}

export async function importHints(pathOrPaths: string|string[]) {
  await importContent(pathOrPaths, 5, createHint)
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
