import { createContext } from 'react'
import { FilteredCategory, Interval } from '@evotempus/types'

type IntervalVisualContext = {
  interval: Interval | undefined
  setInterval: (interval: Interval) => void
  filteredCategories: FilteredCategory[]
  setFilteredCategories: (filteredCategories: FilteredCategory[]) => void
  data: Interval[]
}

export const IntervalVisualContext = createContext<IntervalVisualContext>({
  interval: undefined,
  setInterval: () => {
    /* no-op */
  },
  filteredCategories: [],
  setFilteredCategories: () => {
    /* no-op */
  },
  data: [],
})
