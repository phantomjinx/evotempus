import { createContext, useState } from 'react'
import { FilteredCategory, Interval, Subject } from '@evotempus/types'

export type AppContext = {
  appWidth: number
  appHeight: number
  interval: Interval | undefined
  setInterval: (interval: Interval) => void
  subject: Subject | undefined
  setSubject: (subject: Subject) => void
  filteredCategories: FilteredCategory[]
  setFilteredCategories: (filteredCategories: FilteredCategory[]) => void
}

export const AppContext = createContext<AppContext>({
  appWidth: -1,
  appHeight: -1,
  interval: undefined,
  setInterval: () => {
    /* no-op */
  },
  subject: undefined,
  setSubject: () => {
    /* no-op */
  },
  filteredCategories: [],
  setFilteredCategories: () => {
    /* no-op */
  },
})
