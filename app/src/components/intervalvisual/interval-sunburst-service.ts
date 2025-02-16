import { stratify as d3Stratify, partition as d3Partition } from 'd3-hierarchy'
import { Interval } from '@evotempus/types'
import { Dimensions, SunburstSystemInfo, ViewInterval, ViewNode } from './globals'

export function calculateSystemInfo(width: number, height: number): SunburstSystemInfo {
  const viewPort = 5
  return {
    zoomSystem: {
      ox: (width * viewPort) / 2,
      oy: (height * viewPort) / 2,
      viewPort: viewPort
    },
    radius: Math.min(width, height) * 0.8
  }
}

/*
 * Makes a hierarchy of the json data
 * then partitions it ready for layout
 */
export function partition(data: Interval[]): ViewNode {
  const viewData: ViewInterval[] = []
  for (const interval of data) {
    const v: ViewInterval = new ViewInterval(interval)
    viewData.push(v)
  }

  const newRootNode = d3Stratify<ViewInterval>()
    .id((d: ViewInterval) => d.id())
    .parentId((d: ViewInterval) => d.parent())(viewData)

  //
  // rootNode.sum calculates the value that the node represents
  // This is essential for a partition layout since they're
  // relative areas are determined by node.value
  //
  newRootNode
    .sum((d: ViewInterval) => {
      //
      // The computation takes this value and adds it to
      // the value of any children belonging to it. So to
      // get properly finished circles we should only consider
      // the leaf data only.
      //
      return d.progeny() === 0 ? d.to() - d.from() : 0
    })
    .sort((a, b) => {
      //
      // Whereas sum above uses the actual data objects, sort does not;
      // it uses the HierarchyRectangularNode<ViewInterval>.
      // Therefore, we have to use ...data.from rather than ...from.
      //
      const r = a.data.from() - b.data.from()
      return r
    })

  //
  // Effectively calling partition(rootNode)
  // Adds properties to rootNode and all its children, such as x0, y0, x1, y1
  // size() will calculate the width and height
  //
  return d3Partition<ViewInterval>().size([2 * Math.PI, newRootNode.height + 1])(newRootNode)
}

/*
 * Determines if an arc should be visible
 * based on its position in the hierarchy
 */
export function arcVisible(d: Dimensions): boolean {
  return d.y1 <= 3 && d.y0 >= 1 && d.x1 > d.x0
}
