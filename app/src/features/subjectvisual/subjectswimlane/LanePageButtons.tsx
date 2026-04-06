import React from 'react'
import { ScaleLinear } from 'd3-scale'
import { select as d3Select } from 'd3-selection'
import { SubjectVisualData, SubjectVisualKind, SwimLaneAspect } from "../globals"
import * as service from './subject-swimlane-service'

type LanePageButtonsProps = {
  sysAspect: SwimLaneAspect
  visualData: SubjectVisualData
  xScale: ScaleLinear<number, number, never>
  yScale: ScaleLinear<number, number, never>
  onUpdateKindPage: (kind: string, page: number) => void
}

export const LanePageButtons: React.FunctionComponent<LanePageButtonsProps> = (props: LanePageButtonsProps) => {

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

    if (page > 0) props.onUpdateKindPage(kind.name, page)
  }

  //
  // Mouse Over function for page buttons
  //
  const handlePageMouseOver = (event: React.MouseEvent<SVGTextElement, MouseEvent>, kind: SubjectVisualKind) => {
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
  const handlePageMouseOut = (event: React.MouseEvent<SVGTextElement, MouseEvent>, kind: SubjectVisualKind) => {
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
              onMouseOver={(event) => handlePageMouseOver(event, kind)}
              onMouseOut={(event) => handlePageMouseOut(event, kind)}
            >
              {'\uf150'}
            </text>
          ))
        }
      </g>
    </React.Fragment>
  )
}
