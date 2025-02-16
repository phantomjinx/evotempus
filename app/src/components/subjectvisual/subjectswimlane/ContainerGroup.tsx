import React, { useEffect, useState } from 'react'
import {
  extent as d3Extent,
} from 'd3-array'
import { axisTop as d3AxisTop } from 'd3-axis'
import { interpolateRound as d3InterpolateRound } from 'd3-interpolate'
import { scaleLinear as d3ScaleLinear } from 'd3-scale'
import { select as d3Select } from 'd3-selection'
import { zoom as d3Zoom, zoomIdentity as d3ZoomIdentity } from 'd3-zoom'
import { Interval, Subject } from '@evotempus/types'
import { displayYear } from "@evotempus/utils"
import { SubjectVisualData, SwimLaneAspect } from "../globals"
import * as service from './subject-swimlane-service'
import { Lanes } from './Lanes'
import { IntervalBounds } from './IntervalBounds'
import { Subjects } from './Subjects'
import { LanePageButtons } from './LanePageButtons'
import { svgId } from './constants'

type ContainerGroupProps = {
  sysAspect: SwimLaneAspect
  interval: Interval
  visualData: SubjectVisualData
  onUpdateKindPage: (kind: string, page: number) => void
  setInterval: (interval: Interval) => void
  subject: Subject|undefined
  setSubject: (subject: Subject) => void
  setError: (error: Error) => void
  setErrorMsg: (msg: string) => void
}

export const ContainerGroup: React.FunctionComponent<ContainerGroupProps> = (props: ContainerGroupProps) => {

  /*
   * Restrict the height of the lanes to a maximum of a 1/3 of the height
   * since the bars being too wide look odd. We calculate the height of
   * a lane then compare it to a 1/3 of the height. If wider then, the
   * maximum range is designated a 1/3 of the height.
   */
  const laneHeight = props.sysAspect.innerHeight / props.visualData.lanes.length
  const maxLaneHeight = (props.sysAspect.innerHeight / 3)
  const upperRange = laneHeight > maxLaneHeight ? maxLaneHeight : props.sysAspect.innerHeight

  const calculateYExt = () => {
    const yExt = d3Extent(props.visualData.lanes, d => { return d.meta ? d.meta.id : 0 })
    // Adds 1 to the yExt[1] to ensure an extra blank lane at the bottom of the swimlane
    return [(yExt[0] === undefined ? 0 : yExt[0]), (yExt[1] === undefined ? 1 : yExt[1] + 1)]
  }

  const [currentYZoomState, setCurrentYZoomState] = useState(d3ZoomIdentity)
  const [currentXZoomState, setCurrentXZoomState] = useState(d3ZoomIdentity)

  let xScale = d3ScaleLinear([props.interval.from, props.interval.to], [0, props.sysAspect.innerWidth]).nice()
  let yScale = d3ScaleLinear(calculateYExt(), [0, upperRange])

  if (currentXZoomState) {
    xScale = currentXZoomState.rescaleX(xScale).interpolate(d3InterpolateRound)
  }

  if (currentYZoomState) {
    yScale = currentYZoomState.rescaleY(yScale).interpolate(d3InterpolateRound)
  }

  useEffect(() => {
    /*
     * xAxis DOM Element must exist before the xDataAxis function
     * can be executed on it. So use an effect to execute once default
     * axis container is rendered.
     */

    /*
     * X Axis function for determining the scale
     */
    const xDateAxis = d3AxisTop(xScale).ticks(7).tickFormat(d => displayYear(d.valueOf()))

    const xAxisElement = d3Select<SVGSVGElement, unknown>('#time-axis')
    xDateAxis(xAxisElement)

    /*
     * Workaround for stopping these attributes
     * being default set when xDateAxis function is executed
     */
    xAxisElement.attr('font-size', '').attr('font-family', '')

    const svg = d3Select<SVGSVGElement, unknown>(`#${svgId}`)
    if (! svg || svg.empty()) {
      return
    }

    const zoom = d3Zoom<SVGSVGElement, unknown>()
      .scaleExtent([1, 10])
      .translateExtent([[0, 0], [props.sysAspect.innerWidth, props.sysAspect.innerHeight]])
      .on("zoom", (event) => {

        setCurrentXZoomState(_ => {
          const newState = event.transform

          //
          // The event transform never returns to the original
          // identity transform {k:1, x:0, y:0} so progressively
          // distorts the zoom. Therefore, override it
          //
          if (event.transform.k === 1) newState.x = 0
          return newState
        })

        setCurrentYZoomState(_ => {
          const newState = event.transform
          //
          // The event transform never returns to the original
          // identity transform {k:1, x:0, y:0} so progressively
          // distorts the zoom. Therefore, override it
          //
          if (event.transform.k === 1) newState.y = 0
          return newState
        })
      })


    svg
      .call(zoom)
      .on("dblclick.zoom", null)

    //
    //   //
    //   // After complete rendering if a subject
    //   // has been assigned then traverse to it
    //   //
    //   traverseToSubject(subject, handleVisualClick)
    //
    //   //
    //   // Determine whether to re-open the legend
    //   //
    //   this.setState({
    //     legendVisible: legendVisible
    //   })

  }, [xScale, yScale])

  return (
    <g className='subject-container'>
      <rect
        x={props.sysAspect.margins.left + 10} y={props.sysAspect.margins.top}
        width={props.sysAspect.innerWidth - 10}
        height={props.sysAspect.innerHeight}
        stroke='black' strokeWidth='4' fill='white'
      />
      <g id='time-axis' className='axis' transform={service.marginTranslation(props.sysAspect)} />

      <Lanes
        sysAspect={props.sysAspect} visualData={props.visualData}
        xScale={xScale} yScale={yScale}
      />

      <Subjects
        sysAspect={props.sysAspect} visualData={props.visualData}
        xScale={xScale} yScale={yScale}
        setInterval={props.setInterval}
        subject={props.subject} setSubject={props.setSubject}
        setError={props.setError} setErrorMsg={props.setErrorMsg}
      />

      <IntervalBounds
        sysAspect={props.sysAspect} interval={props.interval} visualData={props.visualData}
        xScale={xScale} yScale={yScale}
      />

      <LanePageButtons
        sysAspect={props.sysAspect} visualData={props.visualData}
        xScale={xScale} yScale={yScale}
        onUpdateKindPage={props.onUpdateKindPage}
      />

    </g>
  )
}
