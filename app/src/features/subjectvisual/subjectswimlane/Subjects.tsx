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

import React, { useContext, useRef } from 'react'
import { ScaleLinear, scaleOrdinal as d3ScaleOrdinal } from 'd3-scale'
import { fetchService, hintService } from '@evotempus/api'
import { Subject } from '@evotempus/types'
import { displayYear, identifier, logDebug } from "@evotempus/utils"
import { SubjectVisualActionContext } from '../context'
import { clickDelay, SubjectVisualData, SwimLaneAspect } from "../globals"
import * as service from './subject-swimlane-service'
import { AppContext } from 'src/core/context'

type SubjectsProps = {
  sysAspect: SwimLaneAspect
  visualData: SubjectVisualData
  xScale: ScaleLinear<number, number, never>
  yScale: ScaleLinear<number, number, never>
  subject: Subject|undefined
}

export const Subjects: React.FunctionComponent<SubjectsProps> = (props: SubjectsProps) => {

  const { setSubject, setInterval } = useContext(AppContext)

  // Subscribing to just the action context avoids re-rendering from the status context
  const { setError, setErrorMsg } = useContext(SubjectVisualActionContext)

  const clickTimerRef = useRef<NodeJS.Timeout | null>(null)
  const clickPreventRef = useRef<boolean>(false)

  const subjectColorCycle = d3ScaleOrdinal(props.visualData.categoryNames, hintService.calcColours(props.visualData.categoryNames))

  /*
   * Click function for selection
   */
  const handleVisualClick = (event: React.MouseEvent<SVGRectElement, MouseEvent>, subject: Subject) => {
    //
    // Put inside timer to allow for double-click
    // event to determine if it should be fired
    //
    clickTimerRef.current = setTimeout(() => {
      if (clickPreventRef.current) {
        clickPreventRef.current = false
        return
      }

      if (! subject)
        return

      if (props.subject === subject) {
        return
      }

      //
      // Tag the data with this as the owner
      //
      setSubject(subject)
    }, clickDelay)
  }

  const handleVisualDoubleClick = (event: React.MouseEvent<SVGRectElement, MouseEvent>, subject: Subject) => {
    logDebug({prefix: 'Subjects', message: 'handleVisualDoubleClick'})

    //
    // Prevent the single click firing when
    // the user actually double-clicked. Stops
    // needless updates out of the component
    //
    if (clickTimerRef.current) clearTimeout(clickTimerRef.current)
    clickPreventRef.current = true

    if (event) {
      event.preventDefault()
    }

    if (! subject) {
      return
    }

    fetchService.intervalEncloses(subject.from, subject.to)
      .then((res) => {
        if (!res.data || res.data.length === 0) {
          setErrorMsg("Error: Cannot navigate to a direct parent interval of the subject")
        } else {
          //
          // Selected the returned interval
          //
          setInterval(res.data[0])
          setSubject(subject)
        }
      }).catch((err) => {
        setError(err)
        setErrorMsg('An error occurred whilst trying to navigate to subject')
      })
  }

  const isSelected = (subject: Subject) => {
    return subject._id === props.subject?._id ? 'subject-outline-clicked' : ''
  }

  return (
    <g id='subjects' clipPath='url(#data-clip)'>
      {
        props.visualData.subjectsByLane.map(laneSubject => {
          return (
            <rect
              id={`subject-${identifier(laneSubject.subject._id)}`}
              key={`subject-${identifier(laneSubject.subject._id)}`}
              className={`visual-subjects ${isSelected(laneSubject.subject)}`}
              rx='5'
              transform={service.marginTranslation(props.sysAspect)}
              x={service.calcSubjectX(laneSubject.subject, props.xScale)}
              y={(props.yScale(laneSubject.laneId)) + 3}
              width={service.calcSubjectWidth(laneSubject.subject, props.xScale)}
              height={service.calcSubjectHeight(laneSubject.subject, props.yScale)}
              fill={(service.calcSubjectWidth(laneSubject.subject, props.xScale) <= 5) ? subjectColorCycle(laneSubject.subject.category) : "url(#gradient-" + identifier(laneSubject.subject.category) + ")"}
              onClick={(event) => handleVisualClick(event, laneSubject.subject)}
              onDoubleClick={(event) => handleVisualDoubleClick(event, laneSubject.subject)}
            >
              <title>{`${laneSubject.subject.name}\n${displayYear(laneSubject.subject.from)}  to  ${displayYear(laneSubject.subject.to)}`}</title>
            </rect>
          )
        })
      }
    </g>
  )
}
