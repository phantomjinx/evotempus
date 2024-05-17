import React, { useContext, useEffect, useState } from 'react'
import { Loading } from '@evotempus/layout'
import { fetchService } from '@evotempus/api'
import { Interval } from '@evotempus/types'
import { consoleLog } from '@evotempus/utils'
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
    consoleLog({ prefix: 'Error', message: errorMsg + '\nDetail: ', object: error })

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
