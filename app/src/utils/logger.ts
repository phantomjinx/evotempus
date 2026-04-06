/*
 * Copyright (C) 2026 P. G. Richardson
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 */

import pino from 'pino'

/*
 * Defined using webpack variable injection. Value is provided
 * by DotEnvPlugin in respective mode webpack config env files
 */
const logger = pino({ level: process.env.LOG_LEVEL || 'info' })

export type LogConfigLevel = 'debug' | 'info' | 'warn' | 'error'

export interface LogConfig {
  prefix?: string
  message?: string
  object?: unknown
  level?: LogConfigLevel
}

export function logError(config: LogConfig) {
  setLevelAndLog(config, 'error')
}

export function logWarn(config: LogConfig) {
  setLevelAndLog(config, 'warn')
}

export function logDebug(config: LogConfig) {
  setLevelAndLog(config, 'debug')
}

export function logInfo(config: LogConfig) {
  setLevelAndLog(config, 'info')
}

function setLevelAndLog(config: LogConfig, targetLevel: LogConfigLevel) {
  if (! config) return

  config.level = targetLevel
  log(config)
}

export function log(config: LogConfig) {
  const msg: string = (config.prefix ? config.prefix + ': ' : '') + (config.message ? config.message : '') + (config.object ? ' ---> ' : '')

  if (!config.level)
    config.level = 'info'

  if (msg.length > 0) {
    switch (config.level) {
    case 'debug':
      logger.debug(msg)
      break
    case 'warn':
      logger.warn(msg)
      break
    case 'info':
      logger.info(msg)
      break
    case 'error':
      logger.error(msg)
    }
  }

  if (config.object) {
    switch (config.level) {
    case 'debug':
      logger.debug(config.object)
      break
    case 'warn':
      logger.warn(config.object)
      break
    case 'info':
      logger.info(config.object)
      break
    case 'error':
      logger.error(config.object)
    }
  }
}
