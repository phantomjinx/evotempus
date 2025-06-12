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
import { CollectionInfo } from 'mongodb'
import { Connection, ConnectOptions } from 'mongoose'
import { logger } from './logger'

export class EvoDbManager {
  conn?: Connection
  options: ConnectOptions

  constructor(user: string, pass: string, clean: boolean) {
    this.options = {
      autoIndex: true,
      directConnection: true
    }

    if (user && user.length > 0) {
      this.options.authSource = 'admin'
      this.options.user = user
      this.options.pass = pass
    }

    this.conn = undefined; // Initialize as undefined
  }

  terminate() {
    if (this.conn) {
      this.conn.close()
    }
    process.exit(1)
  }

  checkConn() {
    if (! this.conn) {
      console.trace()
      logger.error('ERROR: Database connection failed.')
      this.terminate()
    }

    return (this.conn as Connection).db !== undefined
  }

  setConn(connection: Connection) {
    this.conn = connection
    this.checkConn()
  }

  async clean(): Promise<void> {
    this.checkConn()

    if (! this.clean) {
      logger.info('Dropping collections not enabled')
      return
    }

    logger.debug('INFO: Dropping collections from database')

    const collections = await this.conn?.db.listCollections().toArray() || []
    for (let i = 0; i < collections.length; ++i) {
      const collection = collections[i] as CollectionInfo

      if (collection.name === 'intervals' || collection.name === 'subjects' ||
          collection.name === 'topics' ||collection.name === 'hints') {
          await this.conn?.db.dropCollection(collection.name)
      }
    }

    logger.debug('INFO: Dropping collections from database completed')
  }
}
