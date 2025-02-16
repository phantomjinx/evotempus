import {
  ScaleLinear
} from 'd3-scale'
import { FilteredCategory, Subject } from '@evotempus/types'
import { SubjectVisualData, SwimLaneAspect } from '../globals'

export function calculateAspect(width: number, height: number): SwimLaneAspect {
  const viewPort = 5

  const margins = {
    top: ((height / 10) * viewPort),
    right: ((width / 20) * viewPort),
    bottom: ((height / 20) * viewPort),
    left: ((width / 8) * viewPort)
  }

  return {
    margins: margins,
    viewPort: viewPort,
    innerHeight: (height * viewPort) - margins.top - margins.bottom,
    innerWidth: (width * viewPort) - margins.left - margins.right,
  }
}

export function marginTranslation(sysAspect: SwimLaneAspect) {
  return `translate(${sysAspect.margins.left}, ${sysAspect.margins.top})`
}

/*
 * Calculate the X co-ordinate of the subject's timeline bar
 * using the passed-in xScale that governs the conversion
 * from actual year to point on the x-scale.
 * This takes into account subjects whose from date is lower
 * than the minimum of the scale's domain (inc. nice()) hence
 * ensures the bar is pinned accordinly.
 */
export function calcSubjectX(subject: Subject, xScale: ScaleLinear<number, number, never>) {
  const min = xScale.domain()[0]

  const x1 = subject.from < min ? min : subject.from
  return xScale(x1)
}


/*
 * Calculate height from y co-ordinates of this subject(n) & subject(n+1)
 */
export function calcSubjectHeight(subject: Subject, yScale: ScaleLinear<number, number, never>) {
  const laneId = subject.meta ? subject.meta?.laneId : 0
  const m1 = yScale(laneId) + 3
  const m2 = yScale(laneId + 1) - 2
  return m2 - m1
}

/*
 * Calculate the width of the subject's timeline bar
 * using the passed-in xScale that governs the conversion
 * from actual year to point on the x-scale.
 * This takes into account subjects whose range exceeds the
 * minimum and/or maximum of the scale's domain hence ensures
 * the bar is pinned accordingly.
 */
export function calcSubjectWidth(subject: Subject, xScale: ScaleLinear<number, number, never>) {
  const min = xScale.domain()[0]
  const max = xScale.domain()[1]

  const x1 = subject.from < min ? min : subject.from
  const x2 = subject.to > max ? max : subject.to

  const w = xScale(x2) - xScale(x1)
  return w < 5 ? 5 : w // Have a minimum of 5 so at least something is visible
}

export function hasSubjects(visualData: SubjectVisualData | undefined): boolean {
  return !visualData ? false : visualData.lanes.some(lane => lane.subjects.length > 0)
}

export function findSubjectInVisualData(subjectId: string | undefined, visualData: SubjectVisualData): Subject | undefined {
  return !subjectId ? undefined : visualData.lanes.flatMap(lane => lane.subjects).find(s => s._id === subjectId)
}
