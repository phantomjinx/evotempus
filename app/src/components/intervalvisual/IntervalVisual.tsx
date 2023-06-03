import React, { useContext } from 'react'
import { useEffect, useState } from 'react'
import { Loading } from '@evotempus/layout'
import { fetchService } from '@evotempus/api'
import { Interval } from '@evotempus/types'
import { consoleLog } from '@evotempus/utils'
import { ErrorMsg } from './../ErrorMsg'
import './IntervalVisual.scss'
import { IntervalSunburst } from './IntervalSunburst'
import { IntervalVisualContext } from './context'
import { AppContext } from '../app'

let intervalsInit = false

export const IntervalVisual: React.FunctionComponent = () => {
  const { interval, setInterval, filteredCategories, setFilteredCategories } = useContext(AppContext)
  const [errorMsg, setErrorMsg] = useState<string>()
  const [error, setError] = useState<Error>()
  const [loading, setLoading] = useState<boolean>(true)
  const [data, setData] = useState<Interval[]>([])

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
          setData(res.data)
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
    <IntervalVisualContext.Provider value={{ interval, setInterval, filteredCategories, setFilteredCategories, data }}>
      <IntervalSunburst />
    </IntervalVisualContext.Provider>
  )
}
