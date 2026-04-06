import { KindResults, Lane, Subject } from "@evotempus/types"

export const clickDelay = 200

export interface SubjectVisualData {
  raw: KindResults
  kinds: SubjectVisualKind[],
  lanes: Lane[],
  subjectsByLane: SubjectsByLane[],
  categoryNames: string[]
}

export interface SubjectVisualKind {
  name: string,
  lanes: number,
  laneStartIdx: number,
  page: number,
  pages: number
}

export interface SubjectsByLane {
  laneId: number
  subject: Subject
}

export interface SwimLaneAspect {
  viewPort: number
  innerHeight: number
  innerWidth: number
  margins: {
    top: number
    right: number
    bottom: number
    left: number
  }
}
