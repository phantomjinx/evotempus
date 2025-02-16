import { hintService } from '@evotempus/api'
import { FilteredCategory, Interval, KindResult, KindResults, Page, Subject } from '@evotempus/types'
import { consoleLog } from '@evotempus/utils'
import cloneDeep from 'lodash.clonedeep'
import { SubjectVisualData } from './globals'

function sortKinds(kinds: string[]) {
  kinds.sort((a, b) => {
    try {
      const aHint = hintService.getHint(a)
      const bHint = hintService.getHint(b)
      const aOrder = aHint.order ?? 0
      const bOrder = bHint.order ?? 0

      return aOrder - bOrder
    } catch (err) {
      return 0
    }
  })

  return kinds
}

function emptyPage(): Page {
  return { lanes: [{ subjects: [] }] }
}

export function chartify(interval: Interval, rawData: KindResults): SubjectVisualData {
  //
  // Base object to return results
  //
  const visualData: SubjectVisualData = {
    raw: rawData,
    kinds: [],
    lanes: [],
    subjectsByLane: [],
    categoryNames: []
  }

  let categorySet = new Set<string>()

  let kindIdx = 0
  let laneIdx = 0

  let kindNames = []
  for (const kind in rawData) {
    kindNames.push(kind)
  }

  // sort the kind names
  kindNames = sortKinds(kindNames)
  for (const kind of kindNames) {
    if (! rawData[kind])
      continue

    console.log(`Raw Data Kind ${kind} Page is ${rawData[kind].page}`)

    //
    // Clone the raw data so we can enhance it
    //
    const enhanced: KindResult = cloneDeep(rawData[kind])

    categorySet = new Set([...categorySet])
    if (enhanced.categories) {
      enhanced.categories.forEach((category) => categorySet.add(category))
    }

    let page: Page
    const pageIdx = (enhanced.page - 1)
    if (enhanced.pages.length > 0 && pageIdx >= 0 && pageIdx < enhanced.pages.length) {
      page = enhanced.pages[pageIdx]
    } else {
      //
      // pages was empty
      // pageIdx was less than 0 so show no data
      // pageIdx was greater than number of pages returned so show no data
      //
      // Give page 1 arbitrary empty lane
      //
      page = emptyPage()
    }

    /*
     * Avoid losing the divisions between the kinds
     * by padding with a couple of blank lanes either side
     */

    //
    // Pad with a first lane
    //
    if (page.lanes[0].subjects.length > 0) {
      page.lanes.unshift({ subjects: []})
    }

    //
    // Pad a last lane
    //
    if (page.lanes[page.lanes.length - 1].subjects.length > 0) {
      page.lanes.push({ subjects: []})
    }

    let kindLaneIdx = 0
    for (const lane of page.lanes) {
      lane.meta = {
        id: laneIdx,
        kind: {
          id: kindIdx,
          lane: (kindLaneIdx === 0) // Identify the first lane of the kind group
        },
        count: lane.subjects.length
      }
      visualData.lanes.push(lane)

      for (const subject of lane.subjects) {
        visualData.subjectsByLane.push({
          laneId: laneIdx,
          subject: subject
        })

        if (subject.meta)
          // nothing to do
          continue

        subject.meta = {
          laneId: laneIdx,
          kindId: kindIdx,
          //
          // Preserve original datum for export from component
          //
          current: Object.assign({}, subject),

          limit: {
            //
            // Limit subject from to value of interval from
            //
            from: (subject.from < interval.from) ? interval.from : subject.from,
            //
            // Limit subject to to value of interval to
            //
            to: (subject.to > interval.to) ? interval.to : subject.to
          }
        }
      }

      kindLaneIdx++
      laneIdx++
    }

    console.log(`Kind ${kind} Page is ${rawData[kind].page}`)
    visualData.kinds.push({
      name: kind,
      lanes: page.lanes.length,
      laneStartIdx: (laneIdx - page.lanes.length),
      page: rawData[kind].page,
      pages: rawData[kind].count,
    })

    kindIdx++
  }

  visualData.categoryNames = Array.from(categorySet)
  consoleLog({message: '=== VISUAL DATA', object: visualData})
  return visualData
}

export function isSubjectInVisualData(subject: Subject | undefined, visualData: SubjectVisualData): boolean {
  return !subject ? false : visualData.lanes.some(lane => lane.subjects.some(s => s._id === subject._id))
}
