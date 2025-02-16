import React from 'react'
import {
  max as d3Max,
  min as d3Min
} from 'd3-array'
import { ScaleLinear } from 'd3-scale'
import { SubjectVisualData, SwimLaneAspect } from "../globals"
import { Interval } from 'src/types'
import * as service from './subject-swimlane-service'

type IntervalBoundsProps = {
  sysAspect: SwimLaneAspect
  interval: Interval
  visualData: SubjectVisualData
  xScale: ScaleLinear<number, number, never>
  yScale: ScaleLinear<number, number, never>
}

/**
 * Create the bounding blocks of the interval limits
 */
export const IntervalBounds: React.FunctionComponent<IntervalBoundsProps> = (props: IntervalBoundsProps) => {

  const xsMin = props.xScale.domain()[0]
  const xsMax = props.xScale.domain()[1]
  const ysMin = d3Min(props.visualData.lanes, d => d.meta?.id) as number // domain can be smaller, due to nice()
  const ysMax = d3Max(props.visualData.lanes, d => d.meta ? d.meta?.id : 0) as number + 1 // domain can be longer, due to nice()

  const fromX = props.xScale(props.interval.from)
  const toX = props.xScale(props.interval.to)
  const minX = props.xScale(xsMin)
  const maxX = props.xScale(xsMax)
  const minY = props.yScale(ysMin)
  const maxY = props.yScale(ysMax)

  return (
    <React.Fragment>
      <g id='lower-interval-bounds' clipPath='url(#data-clip)'>
        <line className='lowerIntervalBoundLine'
          stroke='black' strokeWidth='2' strokeDasharray='5,5'
          transform={service.marginTranslation(props.sysAspect)}
          x1={fromX} y1={minY} x2={fromX} y2={maxY}
        />
        <rect className='lowerIntervalBoundBlock'
          fill='darkgray' fillOpacity='0.3'
          transform={service.marginTranslation(props.sysAspect)}
          x={minX} y={minY} width={fromX - minX} height={maxY - minY}
        />
      </g>
      <g id='upper-interval-bounds' clipPath='url(#data-clip)'>
        <line className='upperIntervalBoundLine'
          stroke='black' strokeWidth='2' strokeDasharray='5,5'
          transform={service.marginTranslation(props.sysAspect)}
          x1={toX} y1={minY} x2={toX} y2={maxY}
        />
        <rect className='upperIntervalBoundBlock'
          fill='darkgray' fillOpacity='0.3'
          transform={service.marginTranslation(props.sysAspect)}
          x={toX} y={minY} width={maxX - toX} height={maxY - minY}
        />
      </g>
    </React.Fragment>
  )
}
