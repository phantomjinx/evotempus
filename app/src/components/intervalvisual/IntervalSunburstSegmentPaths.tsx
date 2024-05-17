import React, { useRef } from 'react'
import { useSpring, animated, to, easings } from '@react-spring/web'
import { arc as d3Arc } from 'd3-shape'
import { consoleLog, displayYear } from '@evotempus/utils'
import { clickDelay, Dimensions, ViewNode } from './globals'

type SunburstSegmentPathsProps = {
  nodes: ViewNode[]
  parent: ViewNode | undefined
  radius: number
  selected: ViewNode | undefined
  setSelected: (selected: ViewNode, notify: boolean) => void
  navigate: (intervalNode: ViewNode) => void
}

export const IntervalSunburstSegmentPaths: React.FunctionComponent<SunburstSegmentPathsProps> = (
  props: SunburstSegmentPathsProps,
) => {
  const clickTimerRef = useRef<NodeJS.Timeout | null>(null)
  const clickPreventRef = useRef<boolean>(false)

  /*
   * Build a fn for generating the arcs for each of the data block
   * Needed for handleDoubleClicked as well.
   */
  const arc = d3Arc<Dimensions>()
    .startAngle((d) => d.x0)
    .endAngle((d) => d.x1)
    .padAngle((d) => Math.min((d.x1 - d.x0) / 2, 0.005))
    .padRadius(props.radius * 1.5)
    .innerRadius((d) => d.y0 * props.radius)
    .outerRadius((d) => Math.max(d.y0 * props.radius, d.y1 * props.radius - 1))

  const select = (intervalNode: ViewNode | undefined, notify: boolean) => {
    if (!intervalNode || !intervalNode.data.visible || intervalNode === props.parent) {
      return
    }

    consoleLog({ prefix: 'IntervalSunburstSegments', message: 'IntervalVisual: select() ' + intervalNode.data.name() })
    props.setSelected(intervalNode, notify)
  }

  const handleClick = (event: React.MouseEvent<SVGPathElement, MouseEvent>, node: ViewNode | undefined) => {
    //
    // Put inside timer to allow for double-click
    // event to determine if it should be fired
    //
    clickTimerRef.current = setTimeout(() => {
      if (clickPreventRef.current) {
        clickPreventRef.current = false
        return
      }

      consoleLog({ prefix: 'IntervalSunburstSegments', message: `Clicking on ${node?.data.id()} node` })
      select(node, true)
    }, clickDelay)
  }

  const handleDoubleClick = (event: React.MouseEvent<SVGPathElement, MouseEvent>, node: ViewNode | undefined) => {
    //
    // Prevent the single click firing when
    // the user actually double-clicked. Stops
    // needless updates out of the component
    //
    if (clickTimerRef.current) clearTimeout(clickTimerRef.current)

    clickPreventRef.current = true

    if (!node) return

    consoleLog({ prefix: 'IntervalSunburstSegments', message: 'Double-clicking on ' + node.data.id() })

    if (node.data.progeny() === 0) return

    props.navigate(node)
  }

  /*
   * The max steps to be used for the arc rendering animation.
   * Due to a 'bug', this is an exclusive maximum as when the
   * to function 'value' reaches this nothing should be done
   * since it gets assigned in an odd order, eg. '10  1  2  3  ... 9  10'
   */
  const ARC_STEPS_MAX = 10

  /*
   * useSpring hooks must be declared at the top-level of the component.
   * Otherwise, we suffer from "too few hooks have rendered error"
   */
  const sgShowProps = useSpring({
    config: {
      duration: 750,
    },
    from: {
      opacity: 0,
      stroke: 0,
    },
    to: {
      opacity: 1,
      stroke: 1,
    },
    reset: true, // ensure the state of this SpringValue returns to start
  })

  const sgHideProps = useSpring({
    config: {
      duration: 750,
      easing: easings.steps(10),
    },
    from: {
      opacity: 1,
      stroke: 1,
    },
    to: {
      opacity: 0,
      stroke: 0,
    },
    reset: true, // ensure the state of this SpringValue returns to start
  })

  /*
   * The react-spring props for controlling the animation of the
   * movement of the segments. This essentially functions as just
   * a counter with the interpolation being performed in the current
   * Dimensions data object based on the 'value' provided by the to
   * function
   */
  const sgArcProps = useSpring({
    config: {
      duration: 750,
    },
    from: {
      arc: 0,
    },
    to: {
      arc: ARC_STEPS_MAX,
    },
    reset: true, // ensure the state of this SpringValue returns to start
  })

  const segmentPath = (node: ViewNode) => {
    /*
     * Determine which classes to apply to the path
     */
    const classes =
      'segment-path ' +
      (node.data.selected ? 'path-selected ' : 'path-unselected ') +
      (!node.data.visible ? 'path-invisible' : '')

    /*
     * Choose the correct spring props dependent on whether
     * the node needs to come back from being hidden or needs
     * to disappear or should remain in the same state
     */
    let sgDisplayProps
    if (!node.data.wasVisible && node.data.visible) {
      // Entering
      sgDisplayProps = sgShowProps
    } else if (node.data.wasVisible && !node.data.visible) {
      // Exiting
      sgDisplayProps = sgHideProps
    } else {
      // Staying hidden or staying visible
      sgDisplayProps = null
    }

    const nodeArc = (dimensions: Dimensions) => arc(dimensions) || undefined
    const title = node.data.name() + '\n' + displayYear(node.data.from()) + '  to  ' + displayYear(node.data.to())

    return (
      <animated.path
        id={'path-' + node.data.id()}
        className={classes}
        key={node.data.id()}
        fill={'url(#gradient-' + node.data.id() + ')'}
        fillOpacity={sgDisplayProps ? to(sgDisplayProps.opacity, (value) => value) : node.data.visible ? 1.0 : 0}
        strokeOpacity={sgDisplayProps ? to(sgDisplayProps.stroke, (value) => value) : node.data.visible ? 1.0 : 0}
        d={to(sgArcProps.arc, (value) => {
          if (!node.data.current) return undefined

          if (!node.data.target) return nodeArc(node.data.current)

          /**
           * Workaround as 'value' likes to count '10, 1, 2, 3 ... 10'
           * so we exclude the 10 entirely from the animation flow
           */
          node.data.addMarker('animate-arc-step-max', value)
          if (node.data.marker('animate-arc-step-max') === ARC_STEPS_MAX) {
            return nodeArc(node.data.current)
          }

          node.data.current = node.data.current.interpolate(node.data.target, value, ARC_STEPS_MAX)

          // if (node.data.id().includes('hadean')) {
          //   consoleLog({prefix: node.data.id(), message: "children : " + node.data.progeny()});
          //   consoleLog({prefix: node.data.id(), message: "was visible : " + node.data.wasVisible});
          //   consoleLog({prefix: node.data.id(), message: "visible : " + node.data.visible});
          //   consoleLog({prefix: node.data.id(), message: 'dimensions before: '
          //     + '\n\t(Co-ordinates: ' + node.y0 + ' ' + node.y1 + ')'
          //     + '\n\t(Current: ' + ' ' + node.data?.current?.y0 + ' ' + node.data?.current?.y1 + ')'
          //     + '\n\t(Target: ' + ' ' + node.data?.target?.y0 + ' ' + node.data?.target?.y1 + ')'});
          // }

          return nodeArc(node.data.current)
        })}
        style={{ cursor: node.data.progeny() > 0 ? 'pointer' : 'grabbing' }}
        onClick={(e) => handleClick(e, node)}
        onDoubleClick={node.data.progeny() > 0 ? (e) => handleDoubleClick(e, node) : undefined}
      >
        <title>{title}</title>
      </animated.path>
    )
  }

  return <React.Fragment>{props.nodes.map((node) => segmentPath(node))}</React.Fragment>
}
