import React, { useContext, useMemo, useRef } from 'react'
import { AppContext } from '@evotempus/components/app'
import { SubjectVisualContext } from '../context'
import { SubjectVisualLegend } from './subjectvisuallegend'
import * as service from './subject-swimlane-service'
import { Definitions } from './Definitions'
import { ContainerGroup } from './ContainerGroup'
import { svgId } from './constants'
import './SubjectSwimLane.scss'
import { Subject } from 'src/types'

export const SubjectSwimLane: React.FunctionComponent = () => {

  const svgRef = useRef<SVGSVGElement>(null)

  const { interval, setInterval, subject, setSubject, filteredCategories, setFilteredCategories } = useContext(AppContext)
  const { width, height, visualData, onUpdateKindPage,
          legend, setLegend, setError, setErrorMsg } = useContext(SubjectVisualContext)

  /*
   * Calculates the zoom system and radius then caches unless
   * the width and height changes
   */
  const sysAspect = useMemo(() => service.calculateAspect(width, height), [width, height])

  const handleLegendClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setLegend({
      activeTab: legend.activeTab,
      visible: !legend.visible
    })
    event.stopPropagation()
  }

  /*
   * Reset all categories back to visible
   */
  const resetCategories = (event: React.MouseEvent<HTMLButtonElement>) => {
    setFilteredCategories(filteredCategories.map(fc => {
      return { name: fc.name, filtered: false }
    }))

    if (event) {
      event.preventDefault()
    }
  }

  const svgStructure = useMemo(() => {
    if (! visualData || ! interval ) return (<></>)

    return (
      <React.Fragment>
        <Definitions
          sysAspect={sysAspect}
          filteredCategories={filteredCategories}
          kinds={visualData.kinds}
        />

        <ContainerGroup
          sysAspect={sysAspect}
          interval={interval}
          visualData={visualData}
          onUpdateKindPage={onUpdateKindPage}
          setInterval={setInterval}
          subject={subject}
          setSubject={setSubject}
          setError={setError}
          setErrorMsg={setErrorMsg}
        />
      </React.Fragment>
    )
  }, [sysAspect, interval, filteredCategories, subject, visualData])

  if (! interval) {
    return (
      <div className="subject-visual-component">
        <div className="subject-visual-nocontent">
          <p>No geological interval. Try clicking on the Geological Timescale.</p>
        </div>
      </div>
    )
  }

  if (! service.hasSubjects(visualData)) {
    return (
      <div className="subject-visual-component">
        <div className="subject-visual-nocontent">
          <p>No content available for the {interval.name} {interval.kind}</p>
          <p>
            <button className="subject-visual-reset-button" onClick={(e) => resetCategories(e)}>Click</button> to reset category filters
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="subject-visual-component">
      <div className="subject-visual-button">
        <button id="subject-visual-legend-btn" className="fas fa-bars" onClick={handleLegendClick}/>
      </div>
      <SubjectVisualLegend
        height = { height }
        legend = { legend }
        onUpdateLegend = { setLegend }
        categories = { filteredCategories }
        onUpdateCategories={ setFilteredCategories }
        displayedCategoryNames = { visualData?.categoryNames ?? [] }
      />
      <svg
        ref= { svgRef }
        id = { svgId }
        width = { width }
        height = { height }
        viewBox = { "0 0 " + (width * sysAspect.viewPort) + " " + (height * sysAspect.viewPort)}
        preserveAspectRatio="xMidYMid slice"
      >
        {svgStructure}
      </svg>

      <div id='pageBtnTooltip' className='pageBtnTooltip pageBtnTooltipHide' />
    </div>
  )
}
