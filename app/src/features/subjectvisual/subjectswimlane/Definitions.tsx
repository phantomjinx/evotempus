import React from 'react'
import { color as d3Color, RGBColor } from 'd3-color'
import { scaleOrdinal as d3ScaleOrdinal } from 'd3-scale'
import { identifier } from '@evotempus/utils'
import { FilteredCategory } from '@evotempus/types'
import { hintService } from '@evotempus/api'
import { SubjectVisualKind, SwimLaneAspect } from '../globals'

type DefinitionsProps = {
  sysAspect: SwimLaneAspect
  filteredCategories: FilteredCategory[]
  kinds: SubjectVisualKind[]
}

export const Definitions: React.FunctionComponent<DefinitionsProps> = (props: DefinitionsProps) => {

  const categoryNames = props.filteredCategories.map(a => a.name)
  const kindNames = props.kinds.map(a => a.name)

  const categoryColorCycle = d3ScaleOrdinal(categoryNames, hintService.calcColours(categoryNames))
  const laneColorCycle = d3ScaleOrdinal(kindNames, hintService.calcColours(kindNames))

  const nameColor = (name: string, brighter: boolean): string => {
    const ordinal = categoryColorCycle(name)
    const c = d3Color(ordinal) as RGBColor
    return brighter ? c.brighter().brighter().toString() : c.toString()
  }

  const laneColor = (kind: string, brighter: boolean): string => {
    const ordinal = laneColorCycle(kind)
    const c = d3Color(ordinal) as RGBColor
    return brighter ? c.brighter().brighter().toString() : c.toString()
  }

  /*
   * Generate radial gradients
   *
   * Create gradient definitions for all the category names so they are coloured differently
   */
  const nameGradients = categoryNames.map((name) => (
    <radialGradient id={'gradient-' + identifier(name)} cx='50%' cy='50%' r='85%' key={identifier(name)}>
      <stop offset='0%' stopColor={nameColor(name, true)} />
      <stop offset='90%' stopColor={nameColor(name, false)} />
    </radialGradient>
  ))

  const laneGradients = kindNames.map((kind) => (
    <radialGradient id={'gradient-' + identifier(kind)} cx='50%' cy='50%' r='85%' key={identifier(kind)}>
      <stop offset='0%' stopColor={laneColor(kind, true)} />
      <stop offset='90%' stopColor={laneColor(kind, false)} />
    </radialGradient>
  ))

  return (
    <defs>
      {nameGradients}
      {laneGradients}
      <clipPath id='data-clip'>
        <rect
          x={props.sysAspect.margins.left} y={props.sysAspect.margins.top}
          width={props.sysAspect.innerWidth} height={props.sysAspect.innerHeight}
        />
      </clipPath>
      <clipPath id='label-clip'>
        <rect
          x='-10' y={props.sysAspect.margins.top}
          width={props.sysAspect.innerWidth} height={props.sysAspect.innerHeight}
        />
      </clipPath>
      <filter id='pgBtnBackground' x='15%' y='15%' width='70%' height='70%'>
        <feFlood floodColor='white' result='txtBackground' />
        <feMerge>
          <feMergeNode in='txtBackground' />
          <feMergeNode in='SourceGraphic' />
        </feMerge>
      </filter>
    </defs>
  )
}
