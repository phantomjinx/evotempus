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

import React, { useContext } from 'react'
import { ScaleLinear } from 'd3-scale'
import { select as d3Select } from 'd3-selection'
import { SubjectVisualData, SubjectVisualKind, SwimLaneAspect } from "../globals"
import * as service from './subject-swimlane-service'
import { SubjectVisualActionContext } from '../context'

type LanePageButtonsProps = {
  sysAspect: SwimLaneAspect
  visualData: SubjectVisualData
  xScale: ScaleLinear<number, number, never>
  yScale: ScaleLinear<number, number, never>
}

export const LanePageButtons: React.FunctionComponent<LanePageButtonsProps> = (props: LanePageButtonsProps) => {

  // Subscribing to just the action context avoids re-rendering from the status context
  const { onUpdateKindPage } = useContext(SubjectVisualActionContext)

  const showHidePageUpBtn = (kind: SubjectVisualKind) => {
    return (kind.page <= 1) ? `pageUpBtn pageBtnHide` : 'pageUpBtn'
  }

  const showHidePageDownBtn = (kind: SubjectVisualKind) => {
    return (kind.page >= kind.pages) ? `pageDownBtn pageBtnHide` : 'pageDownBtn'
  }

  /*
   * Click function for page buttons
   */
  const handlePageClick = (event: React.MouseEvent<SVGTextElement, MouseEvent>, kind: SubjectVisualKind) => {
    if (event.button > 0) {
      return
    }

    let page = -1
    if (event.currentTarget.id.includes("up") && kind.page > 0) {
      page =  kind.page - 1
    } else if (event.currentTarget.id.includes("down") && kind.page < kind.pages) {
      page = kind.page + 1
    }

    if (page > 0) onUpdateKindPage(kind.name, page)
  }

  //
  // Mouse Over function for page buttons
  //
  const handlePageMouseOver = (kind: SubjectVisualKind) => {
    const pageBtnTooltip = d3Select('#pageBtnTooltip')
    if (! pageBtnTooltip) return

    pageBtnTooltip
      .transition()
      .duration(200)
      .attr('class', 'pageBtnTooltip')

    pageBtnTooltip
      .html("Page " + kind.page + " of " + kind.pages)  }

  //
  // Mouse Out function for page buttons
  //
  const handlePageMouseOut = () => {
    const pageBtnTooltip = d3Select('#pageBtnTooltip')
    if (! pageBtnTooltip) return

    pageBtnTooltip
      .transition()
      .duration(500)
      .attr('class', 'pageBtnTooltip pageBtnTooltipHide')
  }

  return (
    <React.Fragment>
      <g id='lane-page-up-btns' clipPath='url(#data-clip)'>
        {
          props.visualData.kinds.map((kind) => (
            <text
              key={`lane-page-up-btns-${kind.name}`}
              id={`${kind.name}-lane-page-up-btn`}
              className={showHidePageUpBtn(kind)}
              cursor='pointer' filter='url(#pgBtnBackground)'
              transform={service.marginTranslation(props.sysAspect)}
              textAnchor='end' dx='-25' dominantBaseline='hanging'
              x={props.sysAspect.innerWidth}
              y={props.yScale(kind.laneStartIdx + 1)}
              onClick={(event) => handlePageClick(event, kind)}
            >
              {'\uf151'}
            </text>
          ))
        }
      </g>

      <g id='lane-page-down-btns' clipPath='url(#data-clip)'>
        {
          props.visualData.kinds.map((kind) => (
            <text
              key={`lane-page-down-btns-${kind.name}`}
              id={`${kind.name}-lane-page-down-btn`}
              className={showHidePageDownBtn(kind)}
              cursor='pointer' filter='url(#pgBtnBackground)'
              transform={service.marginTranslation(props.sysAspect)}
              textAnchor='end' dx='-25'
              x={props.sysAspect.innerWidth}
              y={props.yScale(kind.laneStartIdx + kind.lanes - 1)}
              onClick={(event) => handlePageClick(event, kind)}
              onMouseOver={() => handlePageMouseOver(kind)}
              onMouseOut={() => handlePageMouseOut()}
            >
              {'\uf150'}
            </text>
          ))
        }
      </g>
    </React.Fragment>
  )
}
