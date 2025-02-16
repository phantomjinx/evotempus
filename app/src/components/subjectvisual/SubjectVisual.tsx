import React, { useCallback, useContext, useEffect, useState, RefObject, useMemo } from 'react'
import cloneDeep from "lodash.clonedeep"
import { fetchService } from '@evotempus/api'
import { Loading } from '@evotempus/layout'
import { FilteredCategory, Interval, KindResults, Legend, Subject, SubjectCriteria } from '@evotempus/types'
import { consoleLog, deepEqual } from '@evotempus/utils'
import { AppContext } from '@evotempus/components/app'
import { ErrorMsg } from '../ErrorMsg'
import { chartify, isSubjectInVisualData } from './subject-visual-service'
import './SubjectVisual.scss'
import { SubjectVisualData } from './globals'
import { SubjectVisualContext } from './context'
import { SubjectSwimLane } from './subjectswimlane'
import isEqual from 'lodash.isequal'
import { useWhatChanged } from '@simbathesailor/use-what-changed'
import { usePrevious } from '../usePrevious'

type SubjectVisualProps = {
  parent: RefObject<HTMLDivElement>
}

const EMPTY_VISUAL_DATA: SubjectVisualData = {
  raw: {},
  kinds: [],
  lanes: [],
  subjectsByLane: [],
  categoryNames: []
}

export const SubjectVisual: React.FunctionComponent<SubjectVisualProps> = (props: SubjectVisualProps) => {

  const { interval,
          subject, setSubject,
          filteredCategories, setFilteredCategories } = useContext(AppContext)

  const [criteria, setCriteria] = useState<SubjectCriteria>()
  const [visualData, setVisualData] = useState<SubjectVisualData>(EMPTY_VISUAL_DATA)

  const [errorMsg, setErrorMsg] = useState<string>()
  const [error, setError] = useState<Error>()
  const [loading, setLoading] = useState<boolean>(true)
  const [width, setWidth] = useState<number>(0)
  const [height, setHeight] = useState<number>(0)

  const [legend, setLegend] = useState<Legend>({
    visible: false,
    activeTab: '',
  })

  console.log('Rendering SubjectVisual')

  //
  // Names of categories to be excluded from subject data
  //
  const excludedCategories = useMemo(() => {
    return filteredCategories
    .filter(category => {
      return category.filtered
    })
    .map(category => category.name)
  }, [filteredCategories])

  /*
   * Track the previous value of interval so that
   * if the context changes and this component re-renders
   * then we can tell if the interval has changed.
   */
  const prevInterval = usePrevious(interval)

  const logErrorState = (errorMsg: string, error: Error) => {
    consoleLog({prefix: "Error", message: errorMsg + "\nDetail: ", object: error})
    setErrorMsg(errorMsg)
    setError(error)
    setLoading(false)
  }

  const updateVisualData = useCallback((interval: Interval | undefined, newRawData: KindResults | undefined) => {
    if (!interval || ! newRawData) {
      setVisualData(EMPTY_VISUAL_DATA)
      return
    }

    //
    // Update the visual data if there are different raw result data
    //
    setVisualData((prev) => {
      //
      // Construct a new rawData set based on prev.raw
      //
      let rawData: KindResults
      if (! prev) {
        // No previous data so set rawData to newRawData
        rawData = newRawData
      }
      else {
        // newRawData may be only a subset if page and kind had been
        // specified so only a subset of the rawData would be overwritten
        rawData = cloneDeep(prev.raw)
        Object.keys(newRawData)
          .forEach((key) => {
            // Overwrite the stashed raw results searched for
            rawData[key] = newRawData[key]
          })
      }

      //
      // If Results is the same as before so no point
      // re-chartify the visual data
      //
      if (deepEqual(prev.raw, rawData)) {
        console.log('results are the same. Returning prev visual data')
        return prev
      }

      console.log(`Creating new visual data: prev=${prev}`)
      console.log(prev)

      const newVisualData = chartify(interval, rawData)
      console.log(newVisualData)
      if (deepEqual(prev, newVisualData)) {
        return prev
      }

      return newVisualData
    })
  }, [])

  const fetchSubjects = useCallback((c: SubjectCriteria) => {
    if (! c) return

    setCriteria(prev => {
      // No critera so will assume existing criteria
      // New criteria equals existing criteria then nothing to do
      if (deepEqual(prev, c)) {
        console.log('Criteria is the same so no update necessary')
        return prev
      } else {
        console.log('setCriteria: Getting new data')
        console.log(prev)
        console.log(c)
      }

      /*
       * Criteria has changed so time for a new visual data
       */

      //
      // If no interval then no data to look up
      //
      if (! c.interval) {
        updateVisualData(c.interval, undefined)
        return c
      }

      //
      // Fetch the subject data from the backend service
      //
      setLoading(true)
      fetchService.subjectsWithin(c)
        .then((res) => {
          //
          // Updated results received
          //
          const results: KindResults = res.data
          consoleLog({message: 'fetchSubjects: results', object: results})
          updateVisualData(c.interval, results)
          setLoading(false)
        })
        .catch((err) => {
          logErrorState("Failed to fetch interval data", err)
          setLoading(false)
        })

      return c
    })
  }, [updateVisualData])

  useEffect(() => {
    console.log('Calling useEffect:dimensions in SubjectVisual')
    const dimensions = () => {
      if (!props.parent || !props.parent.current) {
        return
      }

      const boundingRect = props.parent.current.getBoundingClientRect()
      const width = boundingRect.width
      const height = boundingRect.height

      setWidth(prev => prev === width ? prev : width)
      setHeight(prev => prev === height ? prev : height)
    }

    dimensions()
    window.addEventListener('resize', dimensions)

    return () => window.removeEventListener("resize", dimensions)
  }, [props.parent])

  useEffect(() => {
    //
    // If interval had not changed and is subject
    // in visualData, ie. already displayed
    //
    if (deepEqual(prevInterval, interval) && isSubjectInVisualData(subject, visualData)) {
      return
    }

    //
    // Resets the error
    //
    setError(undefined)
    setErrorMsg(undefined)

    const c: SubjectCriteria = {
      interval: interval,
      subjectId: subject ? subject._id : undefined,
      excludedCategories: excludedCategories
    }

    fetchSubjects(c)

  }, [interval, subject, visualData, excludedCategories, fetchSubjects])

  /*
   * increment or decrement the page of the given kind
   */
  const onUpdateKindPage = (kind: string, page: number) => {
    const rawData = cloneDeep(visualData.raw)
    rawData[kind].page = page
    updateVisualData(interval, rawData)
  }

  if (loading) {
    return (
      <div className='subject-visual-loading'>
        <Loading />
      </div>
    )
  }

  if (error || errorMsg) {
    return <ErrorMsg error={error} errorMsg={errorMsg} />
  }

  return (
    <SubjectVisualContext.Provider value={{
        width, height,
        visualData, onUpdateKindPage,
        legend: legend, setLegend: setLegend,
        setError: setError, setErrorMsg: setErrorMsg
      }}>
      <SubjectSwimLane />
    </SubjectVisualContext.Provider>
  )
}
