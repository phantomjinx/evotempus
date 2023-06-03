import React from 'react'
import { useSpring, animated, to, easings } from '@react-spring/web'
import { Dimensions, ELLIPSIS, TEXT_LENGTH, ViewNode } from './globals'

type SunburstSegmentLabelsProps = {
  nodes: ViewNode[]
  radius: number
}

export const IntervalSunburstSegmentLabels: React.FunctionComponent<SunburstSegmentLabelsProps> = (
  props: SunburstSegmentLabelsProps,
) => {
  /*
   * The max steps to be used for the arc rendering animation.
   * Due to a 'bug', this is an exclusive maximum as when the
   * to function 'value' reaches this nothing should be done
   * since it gets assigned in an odd order, eg. '10  1  2  3  ... 9  10'
   */
  const LABEL_STEPS_MAX = 10

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
  const sgTransformProps = useSpring({
    config: {
      duration: 750,
    },
    from: {
      transform: 0,
    },
    to: {
      transform: LABEL_STEPS_MAX,
    },
    reset: true, // ensure the state of this SpringValue returns to start
  })

  const labelTransformer = (dimensions: Dimensions): string => {
    const x = (((dimensions.x0 + dimensions.x1) / 2) * 180) / Math.PI
    const y = ((dimensions.y0 + dimensions.y1) / 2) * props.radius
    return `rotate(${x - 90}) translate(${y},0) rotate(${x < 180 ? 0 : 180})`
  }

  /*
   * Experimental & naive truncation of text labels
   */
  const labelTruncate = (text: string) => {
    return text.length <= TEXT_LENGTH ? text : text.substring(0, TEXT_LENGTH) + ELLIPSIS
  }

  const segmentLabel = (node: ViewNode) => {
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

    return (
      <animated.text
        key={node.data.id()}
        dy='0.35em'
        fillOpacity={sgDisplayProps ? to(sgDisplayProps.opacity, (value) => value) : node.data.visible ? 1.0 : 0}
        strokeOpacity={sgDisplayProps ? to(sgDisplayProps.stroke, (value) => value) : node.data.visible ? 1.0 : 0}
        transform={to(sgTransformProps.transform, (value) => {
          if (!node.data.current) return ''

          if (!node.data.target)
            return labelTransformer(new Dimensions({ x0: node.x0, x1: node.x1, y0: node.y0, y1: node.y1 }))

          /**
           * Workaround as 'value' likes to count '10, 1, 2, 3 ... 10'
           * so we exclude the 10 entirely from the animation flow
           */
          node.data.addMarker('animate-label-step-max', value)
          if (node.data.marker('animate-label-step-max') === LABEL_STEPS_MAX) {
            return labelTransformer(node.data.target)
          } else {
            const dim = node.data.current.interpolate(node.data.target, value, LABEL_STEPS_MAX)
            return labelTransformer(dim)
          }
        })}
      >
        {labelTruncate(node.data.name())}
      </animated.text>
    )
  }

  return <React.Fragment>{props.nodes.map((node) => segmentLabel(node))}</React.Fragment>
}
