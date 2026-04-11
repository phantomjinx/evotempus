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

import React from 'react'
import { ErrorMsg, Loading } from '@evotempus/components'
import { logError } from '@evotempus/utils'
import { IntervalSunburst } from './IntervalSunburst'
import './IntervalVisual.scss'
import { useIntervalsQuery } from '@evotempus/hooks'

export const IntervalVisual: React.FunctionComponent = () => {
  //
  // Fetch all the intervals from the backend service
  //
  const { data: visualIntervals, isLoading: intervalsLoading, error: intervalsError } = useIntervalsQuery()

  const logErrorState = (errorMsg: string, error: Error) => {
    logError({ prefix: 'IntervalVisual', message: errorMsg + '\nDetail: ', object: error })
  }

  if (intervalsLoading) {
    return (
      <div className='interval-visual-loading'>
        <Loading />
      </div>
    )
  }

  if (intervalsError) {
    const errorMsg = intervalsError?.message || 'Failed to load interval data'
    logErrorState(errorMsg, intervalsError)
    return <ErrorMsg error={intervalsError} errorMsg={errorMsg} />
  }

  return (
    <IntervalSunburst visualIntervals={visualIntervals ?? []}/>
  )
}
