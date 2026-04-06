import React from 'react'
import { ScaleLinear } from 'd3-scale'
import { identifier } from "@evotempus/utils"
import { SubjectVisualData, SubjectVisualKind, SwimLaneAspect } from "../globals"
import * as service from './subject-swimlane-service'

type LanesProps = {
  sysAspect: SwimLaneAspect
  visualData: SubjectVisualData
  xScale: ScaleLinear<number, number, never>
  yScale: ScaleLinear<number, number, never>
}

export const Lanes: React.FunctionComponent<LanesProps> = (props: LanesProps) => {

  const calcLaneNameY = (kind: SubjectVisualKind) => {
    const yn = props.yScale(kind.laneStartIdx + (kind.lanes / 2)) + 0.5
    const fontHeight = 30
    return yn + fontHeight
  }

  return (
    <React.Fragment>
      <g id='lane-lines' clipPath='url(#data-clip)'>
        {
          props.visualData.lanes.map((lane) => (
            <line
              id={`${lane.meta?.id}`}
              key={`lane-lines-${lane.meta?.id}`}
              className='laneLines' transform={service.marginTranslation(props.sysAspect)}
              stroke={lane.meta?.kind.lane ? 'black' : 'lightgray'}
              strokeWidth={lane.meta?.kind.lane ? 5 : 1}
              x1='10'
              y1={(props.yScale(lane.meta ? (lane.meta?.id) : 0) + 0.5)}
              x2={props.sysAspect.innerWidth}
              y2={(props.yScale(lane.meta ? (lane.meta?.id) : 0) + 0.5)}
            />
          )
        )}
      </g>

      <g id='lane-backgrounds' clipPath='url(#data-clip)'>
        {
          props.visualData.kinds.map((kind) => (
            <rect
              key={`lane-backgrounds-${kind.name}`}
              className='laneBackground'
              transform={service.marginTranslation(props.sysAspect)}
              fill={`url(#gradient-${identifier(kind.name)})`}
              x='0'
              y={ (props.yScale(kind.laneStartIdx) + 0.5) }
              width={ props.sysAspect.innerWidth }
              height={ (props.yScale(kind.laneStartIdx + kind.lanes) + 0.5) - (props.yScale(kind.laneStartIdx) + 0.5) }
            />
          ))
        }
      </g>

      <g id='lane-names' clipPath='url(#label-clip)'>
        {
          props.visualData.kinds.map((kind) => (
            <text
              key={`lane-names-${kind.name}`}
              className={kind.name} textAnchor='end'
              transform={service.marginTranslation(props.sysAspect)}
              x='-10'
              y={calcLaneNameY(kind)}
            >
              {kind.name}
            </text>
          ))
        }
      </g>
    </React.Fragment>
  )
}
