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
  private _conn?: Connection
  private _options: ConnectOptions

  constructor(user: string, pass: string, private drop: boolean) {
    this._options = {
      autoIndex: true,
      directConnection: true,
      authSource: 'admin'
    }

    if (user && user.length > 0) {
      this._options.authSource = 'admin'
      this._options.user = user
      this._options.pass = pass
    }

    this._conn = undefined; // Initialize as undefined
  }

  terminate() {
    if (this._conn) {
      this._conn.close()
    }
    process.exit(1)
  }

  checkConn() {
    if (! this._conn) {
      console.trace()
      logger.error('ERROR: Database connection failed.')
      this.terminate()
    }

    return (this._conn as Connection).db !== undefined
  }

  get connection(): Connection | undefined {
    return this._conn
  }

  set connection(connection: Connection) {
    this._conn = connection
    this.checkConn()
  }

  get options() {
    return this._options
  }

  async clean(): Promise<void> {
    this.checkConn()

    if (! this.drop) {
      logger.info('Dropping collections not enabled')
      return
    }

    logger.debug('INFO: Dropping collections from database')

    const collections = await this._conn?.db.listCollections().toArray() || []
    for (let i = 0; i < collections.length; ++i) {
      const collection = collections[i] as CollectionInfo

      if (collection.name === 'intervals' || collection.name === 'subjects' ||
          collection.name === 'topics' ||collection.name === 'hints') {
          await this._conn?.db.dropCollection(collection.name)
      }
    }

    logger.debug('INFO: Dropping collections from database completed')
  }
}
