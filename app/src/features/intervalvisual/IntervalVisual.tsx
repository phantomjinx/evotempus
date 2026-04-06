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

import React, { useContext, useEffect, useState } from 'react'
import { Loading } from '@evotempus/layout'
import { fetchService } from '@evotempus/api'
import { Interval } from '@evotempus/types'
import { log, logError } from '@evotempus/utils'
import { ErrorMsg } from '../ErrorMsg'
import { AppContext } from '@evotempus/components/app'
import { IntervalSunburst } from './IntervalSunburst'
import './IntervalVisual.scss'

let intervalsInit = false

export const IntervalVisual: React.FunctionComponent = () => {
  const [errorMsg, setErrorMsg] = useState<string>()
  const [error, setError] = useState<Error>()
  const [loading, setLoading] = useState<boolean>(true)
  const [visualIntervals, setVisualIntervals] = useState<Interval[]>([])

  const logErrorState = (errorMsg: string, error: Error) => {
    logError({ prefix: 'IntervalVisual', message: errorMsg + '\nDetail: ', object: error })

    setErrorMsg(errorMsg)
    setError(error)
    setLoading(false)
  }

  useEffect(() => {
    if (intervalsInit) return

    intervalsInit = true
    // Fetch the interval data from the backend service
    fetchService
      .intervals()
      .then((res) => {
        if (!res.data || res.data.length === 0) {
          logErrorState('Data failed to be fetched', new Error('Response data payload was empty.'))
        } else {
          setLoading(false)
          setVisualIntervals(res.data)
        }
      })
      .catch((err: Error) => {
        logErrorState('Failed to fetch interval data', err)
      })
  }, [])

  if (loading) {
    return (
      <div className='interval-visual-loading'>
        <Loading />
      </div>
    )
  }

  if (error) {
    return <ErrorMsg error={error} errorMsg={errorMsg} />
  }

  return (
    <IntervalSunburst visualIntervals={visualIntervals}/>
  )
}
