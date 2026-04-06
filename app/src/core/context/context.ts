/*
 * Copyright (C) 2026 P. G. Richardson
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 */

import { createContext } from 'react'
import { FilteredCategory, Interval, Subject } from '@evotempus/types'

export type AppContextType = {
  // appWidth: number
  // appHeight: number
  interval: Interval | undefined
  setInterval: (interval: Interval) => void
  subject: Subject | undefined
  setSubject: (subject: Subject) => void
  filteredCategories: FilteredCategory[]
  setFilteredCategories: (filteredCategories: FilteredCategory[]) => void
}

export const AppContext = createContext<AppContextType>({
  // appWidth: -1,
  // appHeight: -1,
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
  }
})
