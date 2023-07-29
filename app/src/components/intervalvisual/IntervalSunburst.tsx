import { zoom as d3Zoom } from 'd3-zoom'
import React, { useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { stratify as d3Stratify, partition as d3Partition } from 'd3-hierarchy'
import { select as d3Select } from 'd3-selection'
import { Interval } from '@evotempus/types'
import { consoleLog } from '@evotempus/utils'
import { useElementSize } from './../useElement'
import './IntervalVisual.scss'
import { IntervalVisualContext } from './context'
import { Dimensions, svgId, ViewInterval, ViewNode } from './globals'
import { IntervalSunburstDefs } from './IntervalSunburstDefs'
import { IntervalSunburstParent } from './IntervalSunburstParent'
import { IntervalSunburstSegments } from './IntervalSunburstSegments'

export const IntervalSunburst: React.FunctionComponent = () => {
  const [dimRef, { width, height }] = useElementSize()
  const { interval, setInterval, data } = useContext(IntervalVisualContext)
  const [parent, setParent] = useState<ViewNode>()
  const [selected, setSelected] = useState<ViewNode>()

  const svgRef = useRef<SVGSVGElement>(null)

  /*
   * Makes a hierarchy of the json data
   * then partitions it ready for layout
   */
  const partition = (data: Interval[]): ViewNode => {
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
  const arcVisible = (d: Dimensions): boolean => {
    return d.y1 <= 3 && d.y0 >= 1 && d.x1 > d.x0
  }

  /*
   * Calculates the zoom system and radius then caches unless
   * the width and height changes
   */
  const {zoomSystem, radius} = useMemo(() => {
    const viewPort = 5
    const zoomSystem = {
      ox: (width * viewPort) / 2,
      oy: (height * viewPort) / 2,
      viewPort: viewPort
    }

    const radius = Math.min(width, height) * 0.8
    return {zoomSystem, radius}
  }, [width, height])

  /*
   * Provides the zoom and pan capabilities of the svg
   */
  const renderSvg = useCallback(() => {
    //
    // Select the existing svg created by the initial render
    //
    const svg = d3Select<SVGSVGElement, unknown>('#' + svgId)
    const svgGroup = svg.select<SVGGElement>('.interval-container')

    svg
      .call(
        d3Zoom<SVGSVGElement, unknown>()
          .scaleExtent([1, 8])
          .on('zoom', ({ transform }) => {
            const attr = `translate (${transform.x},${transform.y}) scale(${transform.k})`
            svgGroup.attr('transform', attr)
          }),
      )
      .on('dblclick.zoom', null)
  }, [])

  /*
   * Expensive operation like partition from data
   * should happen rarely so add to a memo (caches it) rather than
   * a useEffect which is much less efficient
   */
  const { rootNode, nodeDescendents } = useMemo(() => {
    //
    // Start to structure the data according to a partition heirarchical layout
    //
    const rootNode = partition(data)

    rootNode.each<ViewInterval>((d: ViewNode) => {
      //
      // Caches the starting dimensions to itself for later usage
      //
      d.data.current = new Dimensions({ x0: d.x0, x1: d.x1, y0: d.y0, y1: d.y1 })

      //
      // Cache the result of arcVisible for quick reads later
      //
      d.data.visible = arcVisible(d.data.current)

      // consoleLog({prefix: 'partition', message: d.data.id() + ' has depth of ' + d.depth});
      // consoleLog({prefix: 'partition', message: d.data.id() + ' has coordinates of ' + '(x0: ' + d.x0 + ', x1: ' + d.x1 + ', y0: ' + d.y0 + ', y1: ' + d.y1 + ')'});
      // consoleLog({prefix: 'partition', message: d.data.id() + ' has visible of ' + d.data.visible});
    })

    // Set rootNode initially visible
    rootNode.data.visible = true

    //
    // Sets the parent for display the first time around
    //
    setParent(rootNode)

    return { rootNode, nodeDescendents: rootNode.descendants().slice(1) }
  }, [data])

  const handleSelection = useCallback((newSelected: ViewNode, notify: boolean) => {
    console.log('IntervalSunburst: handleSelection: ' + newSelected.id)

    if (!newSelected) return

    let toSelect
    for (const node of rootNode.descendants()) {
      /*
       * Updates the wasVisible property to the value of visible
       * ensuring that the hide animation on segments will not
       * keep repeating for segments already made invisible
       */
      node.data.wasVisible = node.data.visible

      if (node.id === newSelected.id) {
        node.data.selected = true
        node.data.setOwner(svgId)
        toSelect = node
      } else {
        node.data.selected = false
        node.data.setOwner('')
      }
    }

    if (!toSelect) {
      consoleLog({ prefix: 'Error', message: 'Selection not in graph - something has gone awry!' })
    }

    setSelected(toSelect)

    if (notify) {
      toSelect?.data.call((interval: Interval) => {
        setInterval(interval)
      })
    }
  }, [rootNode, setInterval])

  const handleNavigate = useCallback((intervalNode: ViewNode) => {
    consoleLog({ prefix: 'IntervalSunburst', message: 'Calling navigate to ' + intervalNode.data.id() })
    if (!intervalNode) return

    if (!parent || !rootNode) {
      consoleLog({ prefix: 'IntervalSunburst', message: 'Development issue: parent should not be null?' })
      return
    }

    if (intervalNode === rootNode && rootNode.data.visible) {
      // Nothing to do. Already at rootNode and already visible
      consoleLog({ prefix: 'IntervalSunburst', message: 'Not doing anything as rootNode & visible' })
      return
    }

    //
    // Used for clicking on the central globe to zoom back up.
    // The globe (and so parent) is the current rootNode so simply
    // using it as-is will not cause a zoom-out operation. Thus,
    // we have to reassign it to its own parent.
    //
    // ie. is p the node in the parent selection
    //
    let newParent = intervalNode
    if (intervalNode === parent) {
      consoleLog({
        prefix: 'Navigate',
        message:
          intervalNode.data.id() +
          ' is already the parent so setting its parent as parent: ' +
          (intervalNode.parent?.data.id() || rootNode.data.id()),
      })
      newParent = intervalNode.parent || rootNode
    }

    /*
     * Re-calibrate the visible property based on modification to target arc
     */
    rootNode.each((d) => {
      d.data.target = new Dimensions({
        x0: Math.max(0, Math.min(1, (d.x0 - newParent.x0) / (newParent.x1 - newParent.x0))) * 2 * Math.PI,
        x1: Math.max(0, Math.min(1, (d.x1 - newParent.x0) / (newParent.x1 - newParent.x0))) * 2 * Math.PI,
        y0: Math.max(0, d.y0 - newParent.depth),
        y1: Math.max(0, d.y1 - newParent.depth),
      })

      //
      // Updates the visible field in all nodes in accordance with the
      // logic of arcVisible
      //
      d.data.wasVisible = d.data.visible
      d.data.visible = arcVisible(d.data.target)
    })

    newParent.data.visible = true
    console.log('Setting parent to ' + newParent.id + ' which is visible: ' + newParent.data.visible)
    setParent(newParent)
  }, [rootNode, parent])

  const traverseToViewNode = useCallback(() => {
    //
    // Walk the hierarchy and 'zoom' into the chosen interval
    //
    if (!interval) {
      return // nothing to do
    }

    consoleLog({ prefix: 'IntervalSunburst', message: 'traverseToViewNode ' + interval?._id })

    //
    // Find the actual interval in our hierarchy
    //
    let intervalNode!: ViewNode
    rootNode.each((d) => {
      if (d.id === interval._id) {
        intervalNode = d // Found it!
        return
      }
    })

    if (!intervalNode) {
      consoleLog({
        prefix: 'IntervalSunburst',
        message: 'Error: Cannot traverseToViewNode due to failure to find navigated interval ' + interval._id,
      })
      return
    }

    if (intervalNode.data.id() === selected?.data.id()) {
      consoleLog({ prefix: 'IntervalSunburst', message: 'traverseToViewNode aborted as interval already selected' })
      return
    }

    if (intervalNode.children) {
      //
      // Has children so can become the central circle
      //
      consoleLog({ prefix: 'IntervalSunburst', message: 'traverseToViewNode ' + intervalNode.id + ' as has children' })
      handleNavigate(intervalNode)
    } else if (intervalNode.parent && intervalNode.parent !== parent) {
      //
      // If intervalNode's parent is already the parent then
      // no need to navigate as we are already there
      //
      // No children so select its parent instead then
      // highlight it to display its information
      //
      consoleLog({
        prefix: 'IntervalSunburst',
        message: 'traverseToViewNode ' + intervalNode.parent.id + ' as is parent of ' + intervalNode.id,
      })
      handleNavigate(intervalNode.parent)
    }

    consoleLog({ prefix: 'IntervalSunburst', message: 'traverseToViewNode selecting ' + intervalNode.id })
    handleSelection(intervalNode, false)
  }, [interval, parent, rootNode, selected, handleNavigate, handleSelection])

  /**
   * Effect will occur when the interval has been changed, for example
   * when a search result is clicked on to select the interval and
   * traverse to it
   */
  useEffect(() => {
    traverseToViewNode()
  }, [interval, traverseToViewNode])

  useEffect(() => {
    if (width === 0 && height === 0) return

    renderSvg()
  }, [width, height, renderSvg])

  return (
    <div id='interval-visual-component' ref={dimRef}>
      <svg
        ref={svgRef}
        width={width}
        height={height}
        id={svgId}
        viewBox={'0 0 ' + width * zoomSystem.viewPort + ' ' + height * zoomSystem.viewPort}
        preserveAspectRatio='xMidYMid slice'
      >
        <IntervalSunburstDefs rootNode={rootNode} />
        <g id='interval-container' className='interval-container'>
          <IntervalSunburstSegments
            nodes={nodeDescendents}
            parent={parent}
            radius={radius}
            zoomSystem={zoomSystem}
            selected={selected}
            setSelected={handleSelection}
            navigate={handleNavigate}
          />

          <IntervalSunburstParent
            parent={parent}
            radius={radius}
            zoomSystem={zoomSystem}
            setSelected={handleSelection}
            navigate={handleNavigate}
          />
        </g>
      </svg>
    </div>
  )
}
