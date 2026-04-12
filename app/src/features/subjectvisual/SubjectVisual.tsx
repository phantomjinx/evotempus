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

import React, { useCallback, useContext, useEffect, useState, RefObject, useMemo } from 'react'
import { ErrorMsg, Loading } from '@evotempus/components'
import { AppContext } from '@evotempus/core/context'
import { useSubjectsQuery } from '@evotempus/hooks'
import { Legend } from '@evotempus/types'
import { logDebug, logError } from '@evotempus/utils'
import { chartify, newSubjectCriteria } from './subject-visual-service'
import './SubjectVisual.scss'
import { SubjectVisualData } from './globals'
import { SubjectVisualActionContext, SubjectVisualStateContext } from './context'
import { SubjectSwimLane } from './subjectswimlane'

type SubjectVisualProps = {
  parent: RefObject<HTMLDivElement|null>
}

const EMPTY_VISUAL_DATA: SubjectVisualData = {
  raw: {},
  kinds: [],
  lanes: [],
  subjectsByLane: [],
  categoryNames: []
}

export const SubjectVisual: React.FunctionComponent<SubjectVisualProps> = (props: SubjectVisualProps) => {

  const { interval, subject, filteredCategories } = useContext(AppContext)

  const [width, setWidth] = useState<number>(0)
  const [height, setHeight] = useState<number>(0)
  const [legend, setLegend] = useState<Legend>({
    visible: false,
    activeTab: '',
  })

  // Error state eminating from child components
  const [localError, setLocalError] = useState<Error>()
  const [localErrorMsg, setLocalErrorMsg] = useState<string>()

  // Track pagination overrides rather than the whole dataset
  const [pageOverrides, setPageOverrides] = useState<Record<string, number>>({})

  // Criteria - Query hook uses this as its Cache Key
  const criteria = useMemo(() =>
    newSubjectCriteria(interval, subject, filteredCategories),
  [interval, subject, filteredCategories])

  // The Query fetches the subjects from the server
  // Will avoid if no interval and if subject is already visible in the visual
  const { data: svrSubjectData, isLoading: isSubjectsLoading, error: queryError } = useSubjectsQuery(criteria, {
    enabled: !!interval
  })

  // Derived State: Merge Server Data + Local Overrides -> Chartify
  const visualData = useMemo(() => {
    if (!svrSubjectData || !interval) return EMPTY_VISUAL_DATA

    // Clone the top level of the server data to apply local page overrides
    // without mutating Query's internal cache
    const mergedData = { ...svrSubjectData }
    Object.keys(pageOverrides).forEach(kind => {
      if (mergedData[kind]) {
        mergedData[kind] = { ...mergedData[kind], page: pageOverrides[kind] }
      }
    })

    return chartify(interval, mergedData)
  }, [interval, svrSubjectData, pageOverrides])

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
   * Pagination Handler:
   * updates the local override state
   * increment or decrement the page of the given kind
   */
  const onUpdateKindPage = useCallback((kind: string, page: number) => {
    setPageOverrides(prev => ({ ...prev, [kind]: page }))
  }, [])

  if (isSubjectsLoading) {
    return (
      <div className='subject-visual-loading'>
        <Loading />
      </div>
    )
  }

  // If either the query fails OR a child throws an error, trigger the Error UI
  const activeError = queryError || localError
  const activeErrorMsg = queryError?.message || localErrorMsg

  if (activeError) {
    logError({prefix: "SubjectVisual", message: activeErrorMsg + "\nDetail: ", object: activeError})
    return <ErrorMsg error={activeError instanceof Error ? activeError : undefined} errorMsg={activeErrorMsg} />
  }

  return (
    <SubjectVisualStateContext.Provider value={{ width, height, visualData, legend }}>
      <SubjectVisualActionContext.Provider value={{ onUpdateKindPage, setLegend, setError: setLocalError, setErrorMsg: setLocalErrorMsg }}>
        <SubjectSwimLane />
      </SubjectVisualActionContext.Provider>
    </SubjectVisualStateContext.Provider>
  )
}
