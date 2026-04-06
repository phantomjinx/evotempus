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

import React, { useMemo, useRef } from 'react'
import { clickDelay, SunburstZoomSystem, ViewNode } from './globals'

type SunburstParentProps = {
  parent: ViewNode | undefined
  radius: number
  zoomSystem: SunburstZoomSystem
  setSelected: (selected: ViewNode, notify: boolean) => void
  navigate: (intervalNode: ViewNode) => void
}

export const IntervalSunburstParent: React.FunctionComponent<SunburstParentProps> = (props: SunburstParentProps) => {
  const clickTimerRef = useRef<NodeJS.Timeout | null>(null)
  const clickPreventRef = useRef<boolean>(false)

  const centreTranslation = useMemo(() => {
    return 'translate(' + props.zoomSystem.ox + ',' + props.zoomSystem.oy + ')'
  }, [props.zoomSystem])

  if (!props.parent) {
    return <></>
  }

  const handleClick = (event: React.MouseEvent<SVGCircleElement, MouseEvent>, parentNode: ViewNode | undefined) => {
    //
    // Put inside timer to allow for double-click
    // event to determine if it should be fired
    //
    clickTimerRef.current = setTimeout(() => {
      if (clickPreventRef.current) {
        clickPreventRef.current = false
        return
      }

      if (!parentNode || parentNode !== props.parent || !parentNode.data.visible) {
        return
      }

      props.setSelected(parentNode, true)
    }, clickDelay)
  }

  const handleDoubleClick = (
    event: React.MouseEvent<SVGCircleElement, MouseEvent>,
    parentNode: ViewNode | undefined,
  ) => {
    if (!parentNode) return

    if (parentNode.data.progeny() === 0) return

    //
    // Prevent the single click firing when
    // the user actually double-clicked. Stops
    // needless updates out of the component
    //
    if (clickTimerRef.current) clearTimeout(clickTimerRef.current)

    clickPreventRef.current = true

    // Navigate to the interval
    props.navigate(parentNode)
  }

  return (
    <React.Fragment>
      <circle
        key={'parent-circle-' + props.parent.id}
        id='parent-circle'
        className={props.parent.data.selected ? 'path-selected' : 'path-unselected'}
        r={props.radius}
        fill='url(#parentGradient)'
        pointerEvents='all'
        style={{ cursor: 'pointer' }}
        transform={centreTranslation}
        onClick={(e) => handleClick(e, props.parent)}
        onDoubleClick={(e) => handleDoubleClick(e, props.parent)}
      >
        {props.parent.name}
      </circle>
      <text
        key={'parent-text-' + props.parent.id}
        id='parent-label'
        pointerEvents='none'
        textAnchor='middle'
        style={{ userSelect: 'none', fontWeight: 'bold' }}
        dy='0.35em'
        transform={centreTranslation}
      >
        {props.parent.data.name()}
      </text>
    </React.Fragment>
  )
}
