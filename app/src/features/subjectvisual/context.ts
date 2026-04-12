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
import { Legend } from '@evotempus/types'
import { SubjectVisualData } from './globals'

interface SubjectVisualState {
  width: number
  height: number
  visualData: SubjectVisualData | undefined
  legend: Legend,
}

interface SubjectVisualActions {
  onUpdateKindPage: (kind: string, page: number) => void
  setLegend: (legend: Legend) => void
  setError: (error: Error) => void
  setErrorMsg: (msg: string) => void
}

export const SubjectVisualStateContext = createContext<SubjectVisualState>({
  width: 0,
  height: 0,
  visualData: undefined,
  legend: {
    visible: false,
    activeTab: '',
  },
})

export const SubjectVisualActionContext = createContext<SubjectVisualActions>({
  onUpdateKindPage: () => {
    /* no-op */
  },
  setLegend: () => {
    /* no-op */
  },
  setError: () => {
    /* no-op */
  },
  setErrorMsg: () => {
    /* no-op */
  }
})
