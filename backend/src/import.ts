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

import { Model, Document } from 'mongoose'
import { logger } from './logger'
import fs from 'fs'
import path from 'path'
import readline from 'readline'
import * as utils from './utils'

import {
  ISubject, SubjectModel,
  IInterval, IntervalModel,
  TopicModel, HintModel, IHint, ITopic } from './models'
import { EvoDbManager } from './connection'

export interface ImportStats {
  intervals: number,
  hints: number,
  topics: number,
  subjects: number,
  noLinkSubjects: number
  noGenusSubjects: number
  problematicaSubjects: number
}

type TaggableItem = {
  id: string,
  tag: string
}

/**
 * A specific, self-defined type for our upsert operation object.
 * It's a generic type that works for any document shape.
 */
type UpsertOperation<T> = {
  updateOne: {
    filter: object
    update: object
    upsert?: boolean
  }
}

type Tuple = string[]
type Tuples = Tuple[]

type TupleFn = (tuple: Tuple) => Promise<void>

// The transform function now knows what shape of object it should return
type BulkTransformFn<T> = (tuple: Tuple, minimumCols: number) => UpsertOperation<T> | null

export class Importer {

  private readonly batchSize = 500
  private stats: ImportStats

  constructor(private readonly evoDb: EvoDbManager) {
    this.stats = {
     intervals: 0,
     hints: 0,
     topics: 0,
     subjects: 0,
     noLinkSubjects: 0,
     noGenusSubjects: 0,
     problematicaSubjects: 0,
   }
  }

  /************************************************
   * AUXILIARY HELPER METHODS
   */
  private isString(value: unknown): value is string {
    return typeof value === 'string'
  }

  private expectPopulated(dataArr: Tuple, dataType: string, expectedSize: number) {
    try {
      if (dataArr.length < expectedSize) {
        throw new Error(`ERROR: Number of ${dataType} columns in data is less than expected: [${dataArr}]: { actual: ${dataArr.length}, expected: ${expectedSize} }`)
      }

      for (let i = 0; i < expectedSize; ++i) {
        if (! this.isString(dataArr[i]))
          throw new Error(`ERROR: Cannot create ${dataType}: data is not populated: ${dataArr}`)
      }
    } catch (err) {
      logger.error(err)
      this.evoDb.terminate()
    }
  }

  /************************************************
   * ARROW METHODS CALLED AS ImportFn
   * (Need to preserve this binding)
   */

  private transformIntervalData: BulkTransformFn<IInterval> = (tuple: Tuple, minimumCols: number) => {
    this.expectPopulated(tuple, 'interval', minimumCols)

    const id = utils.trim(tuple[0])
    const name = utils.displayName(id)
    const kind = utils.trim(tuple[1])
    const from = utils.parseNumber(utils.trim(tuple[2]), id)
    const to = utils.parseNumber(utils.trim(tuple[3]), id)
    const parent = utils.trim(tuple[4])

    let children: string[] = []

    if (tuple.length > 5 && this.isString(tuple[5])) {
      //
      // Check the children for empty tuple
      //
      children = tuple[5].split(',')
        .map(child => (child ?? '').trim())
        .filter(child => child.length > 0)
    }

    const documentData: Partial<IInterval> = {
      _id: id,
      name: name,
      kind: kind,
      from: from,
      to: to,
      parent: parent,
      tags: []
    }

    //
    // Only insert a children array if not empty
    //
    if (children.length > 0) {
      documentData.children = children
    }

    this.stats.intervals++

    const uniqueFilter = { _id: id }

    // This return type matches our explicit `UpsertOperation` type.
    return {
      updateOne: {
        filter: uniqueFilter,
        update: { $set: documentData },
        upsert: true
      }
    }
  }

  private transformTopicData(id: string, linkId: string|null, target: string): UpsertOperation<ITopic> | null {
    if (! linkId) return null

    // New id topic
    const documentData: Partial<ITopic> = {
      topic: id,
      linkId: linkId,
      topicTarget: target
    }

    this.stats.topics++

    const uniqueFilter = { topic: id }

    // This return type matches our explicit `UpsertOperation` type.
    return {
      updateOne: {
        filter: uniqueFilter,
        update: { $set: documentData },
        upsert: true
      }
    }
  }

  private transformIntervalTopicData: BulkTransformFn<ITopic> = (tuple: Tuple, minimumCols: number) => {
    this.expectPopulated(tuple, 'Interval', minimumCols)

    //
    // Ensure all whitespace is removed
    //
    const topicId = utils.trim(tuple[0])
    const linkId = utils.trim(tuple[1])

    return this.transformTopicData(topicId, linkId, 'Interval')
  }

  private transformHintData: BulkTransformFn<IHint> = (tuple: Tuple, minimumCols: number) => {
    this.expectPopulated(tuple, 'hint', minimumCols)

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
    const id = utils.trim(tuple[0])

    const documentData: Partial<IHint> = {
      _id: id,
      type: utils.trim(tuple[1]),
      parent: utils.replaceNoValue(tuple[2]),
      colour: utils.replaceNoValue(tuple[3]),
      link: utils.replaceNoValue(tuple[4]),
      order: calcOrder(utils.trim(tuple[5]), id)
    }

    this.stats.hints++

    const uniqueFilter = { _id: id }

    // This return type matches our explicit `UpsertOperation` type.
    return {
      updateOne: {
        filter: uniqueFilter,
        update: { $set: documentData },
        upsert: true
      }
    }
  }

  private transformTupleToSubject(tuple: Tuple, minimumCols: number): Partial<ISubject> | null {
    this.expectPopulated(tuple, 'subject', minimumCols)

    const id = utils.trim(tuple[0])
    const name = utils.displayName(id)
    const kind = utils.trim(tuple[1])
    const category = utils.trim(tuple[2])
    const from = utils.parseNumber(utils.trim(tuple[3]), id)
    const to = utils.parseNumber(utils.trim(tuple[4]), id)
    const linkId = utils.trim(tuple[5])

    let tags: string[] = []
    if (tuple.length > 6) {
      const tagStr = utils.trim(tuple[6])
      if (! utils.noValue(tagStr)) {
        tags = tagStr.split(',')
      }
    }
    tags = tags.map(t => t.trim()).filter(t => t.length > 0)

    if (id === 'NO_GENUS_SPECIFIED') {
      logger.debug('Ignoring row with no genus: %s %s %s %s %d %d', id, name, kind, category, from, to)
      this.stats.noGenusSubjects++
      return null
    }

    if (category === 'Problematica') {
      logger.debug('Ignoring row with problematic phylum: %s %s %s %s %d %d', id, name, kind, category, from, to)
      this.stats.problematicaSubjects++
      return null
    }

    if (utils.noValue(linkId)) {
      this.stats.noLinkSubjects++
      return null // Only import subjects with a wikipedia link id
    }

    const documentData: Partial<ISubject> = {
      _id: id,
      name: name,
      kind: kind,
      category: category,
      from: from,
      to: to,
      tags: tags
    }

    this.stats.subjects++

    return documentData
  }

  /************************************************
   * READ AND WRITE METHODS
   */

  private async readFile(fullPath: string, minimumCols: number, tupleFn: TupleFn) {
    const fileStream = fs.createReadStream(fullPath)
    const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity })

    for await (const line of rl) {
      if (line.startsWith('#')) continue

      const tuple = line.split('|') as Tuple
      if (tuple.length < minimumCols) {
        logger.warn(`WARN: Skipping malformed row in ${fullPath}: ${line}`)
        continue
      }

      await tupleFn(tuple)
    }
  }

  private async writeBatches<TDoc extends Document>(model: Model<TDoc>, mainOps: UpsertOperation<TDoc>[], topicOps: UpsertOperation<ITopic>[]) {
    const promises = []
    if (mainOps.length > 0) {
      promises.push(model.bulkWrite(mainOps))
    }

    if (topicOps.length > 0) {
      promises.push(TopicModel.bulkWrite(topicOps))
    }

    if (promises.length > 0) {
      await Promise.all(promises)
      logger.debug(`INFO: Wrote batch Main ops: ${mainOps.length}, Topic ops: ${topicOps.length}`)
    }
  }

  private async importWithBulkWrite<TDoc extends Document>(
    fullPath: string, minimumCols: number,
    model: Model<TDoc>, transformFn: BulkTransformFn<TDoc>) {

    logger.debug(`INFO: Processing upserts from ${fullPath}`)

    let mainOps: UpsertOperation<TDoc>[] = []
    let topicOps: UpsertOperation<ITopic>[] = []

    await this.readFile(fullPath, minimumCols, async (tuple: Tuple) => {
      const op = transformFn(tuple, minimumCols)
      if (!op) {
        // row did not create a valid operation
        return
      }

      // Always push only the updateOne
      mainOps.push(op)

      if (mainOps.length >= this.batchSize) {
        await this.writeBatches(model, mainOps, topicOps)
        mainOps = []
        topicOps = []
      }
    })

    // Write any remaining operations after the loop finishes.
    await this.writeBatches(model, mainOps, topicOps)
    mainOps = []
    topicOps = []
  }

  private async getAllFilePaths(pathOrPaths: string | string[]): Promise<string[]> {
    const initialPaths = Array.isArray(pathOrPaths) ? pathOrPaths : [pathOrPaths]
    const allFiles: string[] = []

    // This recursive helper is cleaner
    const findFiles = async (currentPath: string) => {
      try {
        // Use readdir with withFileTypes for efficiency
        const entries = await fs.promises.readdir(currentPath, { withFileTypes: true })
        for (const entry of entries) {
          const fullEntryPath = path.join(currentPath, entry.name)
          if (entry.isDirectory()) {
            await findFiles(fullEntryPath); // Recurse
          } else if (path.extname(fullEntryPath) === '.dat') {
            allFiles.push(fullEntryPath)
          }
        }
      } catch (error: any) {
        // This handles cases where the initial path is a file, not a directory
        if (error.code === 'ENOTDIR' && path.extname(currentPath) === '.dat') {
          allFiles.push(currentPath)
        } else {
          logger.error(`ERROR: Path could not be read: ${currentPath}`, error)
        }
      }
    }

    for (const p of initialPaths) {
      const fullPath = path.resolve(__dirname, '..', p)
      await findFiles(fullPath)
    }

    return allFiles
  }

  private async importContent<TDoc extends Document>(
    pathOrPaths: string|string[], minimumCols: number,
    typeModel: Model<TDoc>, transformFn: BulkTransformFn<TDoc>) {

    // Build a complete, flat list of all file paths.
    const allFilesToProcess: string[] = await this.getAllFilePaths(pathOrPaths)

    if (allFilesToProcess.length === 0) {
      logger.warn(`WARN: No files found to import for the given path ${pathOrPaths}`)
    }

    // Define concurrency limit (how many files to process at once)
    const chunkSize = 10
    logger.info(`Processing ${allFilesToProcess.length} files in chunks of ${chunkSize}...`)

    for (let i = 0; i < allFilesToProcess.length; i += chunkSize) {
      // Get the current chunk of file paths.
      const chunk = allFilesToProcess.slice(i, i + chunkSize)
      logger.info(`Processing chunk ${i / chunkSize + 1}: ${chunk.map(p => path.basename(p)).join(', ')}`)

      // Create an array of promises for ONLY the current chunk.
      const importPromises = chunk.map(filePath =>
        this.importWithBulkWrite(filePath, minimumCols, typeModel, transformFn)
      )

      // Wait for the current chunk to complete before starting the next.
      try {
        await Promise.all(importPromises)
      } catch (error) {
        logger.error(`ERROR: A problem occurred while processing a chunk.`, error)
      }
    }
  }

  private async tagIntervalOrSubject(taggableItems: TaggableItem[]) {
    if (!taggableItems || taggableItems.length === 0) {
      logger.warn('No taggable items to tag')
      return
    }

    // Gather all unique identifiers from the input data
    const itemNames = taggableItems.map(item => item.id)

    // Pre-fetch all existing documents from BOTH collections in parallel
    const [intervals, subjects] = await Promise.all([
      // Use $in for a single efficient query. Project only the `_id` and `name` for speed.
      IntervalModel.find({ _id: { $in: itemNames } }).select('_id name').lean(),
      SubjectModel.find({ _id: { $in: itemNames } }).select('_id name').lean()
    ])

    // Create fast lookup sets for easy classification
    const intervalIds = new Set(intervals.map(doc => doc._id))
    const subjectIds = new Set(subjects.map(doc => doc._id))

    // Build the separate operation arrays
    const intervalUpdateOps: UpsertOperation<IInterval>[] = []
    const subjectUpdateOps: UpsertOperation<ISubject>[] = []

    for (const item of taggableItems) {
      const updateOperation = {
        filter: { _id: item.id },
        update: { $addToSet: { tags: item.tag } }
      }

      // Classify the item and add its operation to the correct batch
      if (intervalIds.has(item.id)) {
        intervalUpdateOps.push({ updateOne: updateOperation })
      } else if (subjectIds.has(item.id)) {
        subjectUpdateOps.push({ updateOne: updateOperation })
      } else {
        logger.warn(`WARN: Item to tag with id '${item.id}' not found in Intervals or Subjects.`)
        logger.warn(intervalIds)
      }
    }

    // Execute both bulk writes in parallel
    const promisesToExecute = []
    if (intervalUpdateOps.length > 0) {
      logger.info(`Tagging ${intervalUpdateOps.length} intervals...`)
      promisesToExecute.push(IntervalModel.bulkWrite(intervalUpdateOps))
    }

    if (subjectUpdateOps.length > 0) {
      logger.info(`Tagging ${subjectUpdateOps.length} subjects...`)
      promisesToExecute.push(SubjectModel.bulkWrite(subjectUpdateOps))
    }

    if (promisesToExecute.length > 0) {
      try {
        const results = await Promise.all(promisesToExecute)
        logger.info(`Tagging of ${results.length} intervals and subjects is complete.`)
      } catch (error) {
        logger.error('An error occurred during tagging: ', error)
      }
    }
  }

  /************************************************
   * PUBLIC IMPORT METHODS
   */
  async importIntervals(pathOrPaths: string|string[]) {
    await this.importContent(pathOrPaths, 6, IntervalModel, this.transformIntervalData)
    logger.debug('INFO: import of intervals complete')
  }

  async importIntervalTopics(pathOrPaths: string|string[]) {
    await this.importContent(pathOrPaths, 2, TopicModel, this.transformIntervalTopicData)
    logger.debug('INFO: import of topics complete')
  }

  async importHints(pathOrPaths: string|string[]) {
    await this.importContent(pathOrPaths, 7, HintModel, this.transformHintData)
    logger.debug('INFO: import of hints complete')
  }

  async importSubjects(pathOrPaths: string|string[]) {
    const allFiles = await this.getAllFilePaths(pathOrPaths)

    const fileDataMap = new Map<string, Tuples>()
    let totalFileRows = 0

    for (const filePath of allFiles) {
      await this.readFile(filePath, 6, async (tuple: Tuple) => {
        if (tuple.length === 0) {
          logger.error(`A tuple from file ${filePath} has somehow been added with no length`)
          return
        }

        const id = tuple[0]
        if (!id || id.length === 0) {
          logger.error(`A tuple id from file ${filePath} has somehow been added with no length`)
          return
        }

        // Add a new identified to map if not already
        if (! fileDataMap.has(id))
          fileDataMap.set(id, [])

        // Add the new tuple to the id
        fileDataMap.get(id)!.push(tuple)
        totalFileRows++
      })
    }
    logger.info(`Extracted ${totalFileRows} rows for ${fileDataMap.size} unique subject IDs from files.`)

    //
    // Extract from Database
    // Now, fetch all documents from the DB that match the IDs found in our files.
    // .lean() is crucial for performance here
    //
    const allFileSubjectIDs = Array.from(fileDataMap.keys())
    const existingSubjectsFromDB = await SubjectModel.find({ _id: { $in: allFileSubjectIDs }}).lean()
    logger.info(`Fetched ${existingSubjectsFromDB.length} existing subjects from the database.`)

    // Merge DB data and file data, applying aggregation rules.

    // Pre-populate our aggregation map with the current state from the database
    // Add linkId to the map's type
    const aggregatedSubjects = new Map<string, Partial<ISubject> & { linkId?: string }>(
        existingSubjectsFromDB.map(doc => [doc._id, doc])
    )

    // Now, iterate over the data from the files and apply it to our map.
    for (const [id, tuples] of fileDataMap.entries()) {
      for (const tuple of tuples) {

        const subject = this.transformTupleToSubject(tuple, 6)
        if (!subject) continue

        // Capture the linkId from the file row as not included in subject
        const linkId = utils.trim(tuple[5])

        const existing = aggregatedSubjects.get(id)

        if (!existing) {
          // This is a brand new subject (not in DB, and first time we've seen it in the files).
          // Store the linkId along with the other data.
          aggregatedSubjects.set(id, { ...subject, linkId: linkId })

        } else {
          // This subject exists (either from the DB or a previous file). Aggregate it.
          // Consistency Checks
          if (existing.name !== subject.name || existing.kind !== subject.kind || existing.category !== subject.category) {
            logger.error(`FATAL: Data inconsistency for subject ID ${id}. Halting.`)
            this.evoDb.terminate()
            return
          }

          // Make the time span as wide to conform to existing and subject
          existing.from = Math.min(existing.from!, subject.from!)
          existing.to = Math.max(existing.to!, subject.to!)

          // Aggregate tags
          const combinedTags = new Set([...existing.tags!, ...subject.tags!])
          existing.tags = Array.from(combinedTags)

          // Preserve the linkId if the existing record didn't have one.
          if (!existing.linkId && linkId) {
            existing.linkId = linkId
          }
        }
      }
    }
    logger.info(`Aggregation complete. Result is ${aggregatedSubjects.size} unique subjects.`)

    // Write the final, aggregated results back to the database.
    let mainOps: UpsertOperation<ISubject>[] = []
    let topicOps: UpsertOperation<ITopic>[] = []

    for (const subject of aggregatedSubjects.values()) {
      // Separate linkId from the actual subject data
      const { linkId, ...subjectDoc } = subject

      mainOps.push({
        updateOne: {
          filter: { _id: subjectDoc._id },
          update: { $set: subjectDoc },
          upsert: true
        }
      })

      const topicOperation = this.transformTopicData(subjectDoc._id!, linkId ?? null, 'Subject')
      if (topicOperation) topicOps.push(topicOperation)
    }

    if (mainOps.length > 0) {
      for (let i = 0; i < mainOps.length; i += this.batchSize) {
        const chunk = mainOps.slice(i, i + this.batchSize)
        try {
          await this.writeBatches(SubjectModel, chunk, [])
          logger.info(`Loaded chunk of ${chunk.length} subjects to the database.`)
        } catch (error) {
          logger.error('A fatal error occurred during the final bulk write:', error)
          this.evoDb.terminate()
        }
      }
    }

    if (topicOps.length > 0) {
      for (let i = 0; i < topicOps.length; i += this.batchSize) {
        const chunk = topicOps.slice(i, i + this.batchSize)
        try {
          await this.writeBatches(SubjectModel, [], chunk)
          logger.info(`Loaded chunk of ${chunk.length} subject topics to the database.`)
        } catch (error) {
          logger.error('A fatal error occurred during the final bulk write:', error)
          this.evoDb.terminate()
        }
      }
    }

    this.stats.subjects = aggregatedSubjects.size
    logger.debug('INFO: import of subjects complete')
  }

  async importTags(pathOrPaths: string|string[]) {
    const minimumCols = 2
    const allFilesToProcess: string[] = await this.getAllFilePaths(pathOrPaths)

    // Create an array of promises, one for each file import task.
    const taggablePromises = allFilesToProcess.map(async filePath => {
      const taggableItems: TaggableItem[] = []
      const fileStream = fs.createReadStream(filePath)
      const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity })

      for await (const line of rl) {
        if (line.startsWith('#')) continue

        const data = line.split('|')
        if (data.length < minimumCols) {
          logger.warn(`WARN: Skipping malformed row in ${filePath}: ${line}`)
          continue
        }

        this.expectPopulated(data, 'tag', minimumCols)

        taggableItems.push({
          id: utils.trim(data[0]),
          tag: utils.trim(data[1])
        })
      }

      return taggableItems
    })

    // Wait for all file reading to complete
    const nestedItems = await Promise.all(taggablePromises)

    // Flatten the array of arrays into a single list
    const taggableItems = nestedItems.flat()

    //
    // taggableItems should be populated once all have been processed
    //
    if (taggableItems.length === 0) {
      logger.warn('WARN: No files found to tag for the given paths.')
      return
    }

    logger.debug(`Processing ${taggableItems.length} tags`)

    await this.tagIntervalOrSubject(taggableItems)
  }

  reportStats() {
     logger.info(this.stats)
  }
}
