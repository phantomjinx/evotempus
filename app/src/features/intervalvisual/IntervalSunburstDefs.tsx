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

import React from 'react'
import { color as d3Color, RGBColor } from 'd3-color'
import { hintService } from '@evotempus/api'
import { ViewNode } from './globals'

type SunburstDefProps = {
  rootNode: ViewNode
}

export const IntervalSunburstDefs: React.FunctionComponent<SunburstDefProps> = (props: SunburstDefProps) => {
  const parentColorWithDepth = (node: ViewNode): string => {
    //
    // Finds the ultimate's parent colour & tracks the depth
    //
    let depth = 0
    let p: ViewNode | null = node
    while (p && p.depth > 1) {
      p = p.parent
      depth++
    }

    //
    // Gets the parent node colour then
    // darkens according to the level of depth
    //
    let c = d3Color(hintService.calcColour(node.data.name())) as RGBColor
    for (let i = 0; i < depth; ++i) {
      c = c.darker()
    }

    return c.toString()
  }

  /*
   * Generate a radial gradient
   *
   * Create gradient definitions for all the segments so they are coloured differently
   * using the 'color' above but also shade to white to give a sheen effect
   */
  const nodes: ViewNode[] = props.rootNode.descendants().slice(1)
  const segmentGrads = nodes.map((node) => (
    <radialGradient id={'gradient-' + node.data.id()} cx='30%' cy='30%' r='75%' key={node.data.id()}>
      <stop offset='0%' stopColor='white' />
      <stop offset='75%' stopColor={parentColorWithDepth(node)} />
    </radialGradient>
  ))

  return (
    <defs>
      <radialGradient id='parentGradient' cx='30%' cy='30%' r='75%'>
        <stop offset='0%' stopColor='#ffffff' />
        <stop offset='50%' stopColor='#61dafb' />
        <stop offset='90%' stopColor='#1a8a7c' />
        <stop offset='100%' stopColor='#164d21' />
      </radialGradient>
      {segmentGrads}
    </defs>
  )
}
