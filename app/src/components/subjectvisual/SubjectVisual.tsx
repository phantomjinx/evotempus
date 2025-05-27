import React, { useCallback, useContext, useEffect, useState, RefObject } from 'react'
import cloneDeep from "lodash.clonedeep"
import { fetchService } from '@evotempus/api'
import { Loading } from '@evotempus/layout'
import { FilteredCategory, Interval, KindResults, Legend, Subject, SubjectCriteria } from '@evotempus/types'
import { log, deepEqual, logDebug, logError } from '@evotempus/utils'
import { AppContext } from '@evotempus/components/app'
import { ErrorMsg } from '../ErrorMsg'
import { chartify, excludedCategories, isSubjectInVisualData, newSubjectCriteria } from './subject-visual-service'
import './SubjectVisual.scss'
import { SubjectVisualData } from './globals'
import { SubjectVisualContext } from './context'
import { SubjectSwimLane } from './subjectswimlane'

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

const EMPTY_CRITERIA: SubjectCriteria = {
  interval: undefined,
  subjectId: undefined,
  excludedCategories: []
}

export const SubjectVisual: React.FunctionComponent<SubjectVisualProps> = (props: SubjectVisualProps) => {

  const { interval, subject, filteredCategories } = useContext(AppContext)

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [_, setCriteria] = useState<SubjectCriteria>(EMPTY_CRITERIA)
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

  const logErrorState = (errorMsg: string, error: Error) => {
    logError({prefix: "SubjectVisual", message: errorMsg + "\nDetail: ", object: error})
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
      logDebug({prefix: 'SubjectVisual', message: 'Setting new visual data'})

      //
      // Construct a new rawData set based on prev.raw
      //
      let rawData: KindResults
      if (! prev) {
        // No previous data so set rawData to newRawData
        rawData = newRawData
      }
      else {
        logDebug({prefix: 'SubjectVisual', message: 'Updating with new visual data'})
        // newRawData may be only a subset if page and kind had been
        // specified so only a subset of the rawData would be overwritten
        rawData = cloneDeep(prev.raw)
        Object.keys(newRawData)
          .forEach((key) => {
            // Overwrite the stashed raw results searched for
            rawData[key] = newRawData[key]
          })
      }

      logDebug({prefix: 'SubjectVisual', message: 'updating raw data', object: rawData})

      //
      // If Results is the same as before so no point
      // re-chartify the visual data
      //
      if (deepEqual(prev.raw, rawData)) {
        logDebug({prefix: 'SubjectVisual', message: 'results are the same. Returning prev visual data'})
        return prev
      }

      logDebug({message: 'Creating new visual data - prev', object: prev})

      const newVisualData = chartify(interval, rawData)

      logDebug({message: 'Creating new visual data - newVisualData', object: newVisualData})
      if (deepEqual(prev, newVisualData)) {
        return prev
      }

      return newVisualData
    })
  }, [])

  useEffect(() => {
    setCriteria(prev => {
      logDebug({prefix: 'SubjectVisual', message: 'Setting Criteria', object: prev})
      const intervalChanged = ! deepEqual(prev.interval, interval)
      const subjectChanged = ! deepEqual(prev.subjectId, subject?._id)
      const exCategoriesChanged = ! deepEqual(prev.excludedCategories, excludedCategories(filteredCategories))

      // The visualData changed but the criteria did not so nothing to do
      if (!intervalChanged && !subjectChanged && !exCategoriesChanged) {
        return prev
      }

      // Prepare a new criteria object
      const newCriteria = newSubjectCriteria(interval, subject, filteredCategories)

      //
      // If no interval then no data to look up
      //
      if (! interval) {
        updateVisualData(interval, undefined)
        return newCriteria
      }

      //
      // If filters have changed then a new lookup is required
      // If they haven't then the change could just be a new selection
      // within the current visual data
      //
      if (!exCategoriesChanged && subjectChanged) {
        if (isSubjectInVisualData(subject, visualData)) {
          // Filters not changed and subject in visual data
          // So only reselection will be required
          return newCriteria
        }
      }

      //
      // Resets the error
      //
      setError(undefined)
      setErrorMsg(undefined)

      //
      // Fetch the subject data from the backend service
      //
      setLoading(true)
      fetchService.subjectsWithin(newCriteria)
        .then((res) => {
          //
          // Updated results received
          //
          const results: KindResults = res.data
          logDebug({prefix: 'SubjectVisual', message: 'fetchSubjects: results', object: results})
          updateVisualData(newCriteria.interval, results)
          setLoading(false)
        })
        .catch((err) => {
          logErrorState("Failed to fetch interval data", err)
          setLoading(false)
        })

      return newCriteria
    })

  }, [interval, subject, filteredCategories, updateVisualData, visualData])

  useEffect(() => {
    logDebug({prefix: 'SubjectVisual', message: 'Calling useEffect:dimensions in SubjectVisual'})
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
