import React from 'react'
import { color as d3Color, RGBColor } from 'd3-color'
import { ViewNode } from './globals'
import { hintService } from 'src/api'

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
  const nodes = props.rootNode.descendants().slice(1)
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
