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
