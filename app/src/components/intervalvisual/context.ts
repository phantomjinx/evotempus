import { createContext } from 'react'
import { Interval } from '@evotempus/types'

type IntervalVisualContext = {
  interval: Interval | undefined
  setInterval: (interval: Interval) => void
  data: Interval[]
}

export const IntervalVisualContext = createContext<IntervalVisualContext>({
  interval: undefined,
  setInterval: () => {
    /* no-op */
  },
  data: [],
})
