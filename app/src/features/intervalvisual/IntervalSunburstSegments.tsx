import React, { useMemo } from 'react'
import { SunburstZoomSystem, ViewNode } from './globals'
import { IntervalSunburstSegmentPaths } from './IntervalSunburstSegmentPaths'
import { IntervalSunburstSegmentLabels } from './IntervalSunburstSegmentsLabels'

type SunburstSegmentsProps = {
  nodes: ViewNode[]
  parent: ViewNode | undefined
  radius: number
  zoomSystem: SunburstZoomSystem
  selected: ViewNode | undefined
  setSelected: (selected: ViewNode, notify: boolean) => void
  navigate: (intervalNode: ViewNode) => void
}

export const IntervalSunburstSegments: React.FunctionComponent<SunburstSegmentsProps> = (
  props: SunburstSegmentsProps,
) => {
  const centreTranslation = useMemo(() => {
    return 'translate(' + props.zoomSystem.ox + ',' + props.zoomSystem.oy + ')'
  }, [props.zoomSystem])

  return (
    <React.Fragment>
      <g id='int-segment-container' className='int-segment-container' transform={centreTranslation}>
        <IntervalSunburstSegmentPaths
          nodes={props.nodes}
          parent={props.parent}
          radius={props.radius}
          selected={props.selected}
          setSelected={props.setSelected}
          navigate={props.navigate}
        />
      </g>
      <g
        id='int-label-container'
        className='int-label-container'
        transform={centreTranslation}
        pointerEvents='none'
        textAnchor='middle'
        style={{ userSelect: 'none', fontWeight: 'bold' }}
      >
        <IntervalSunburstSegmentLabels nodes={props.nodes} radius={props.radius} />
      </g>
    </React.Fragment>
  )
}
