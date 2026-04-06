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

interface SubjectVisualContext {
  width: number
  height: number
  visualData: SubjectVisualData | undefined
  onUpdateKindPage: (kind: string, page: number) => void
  legend: Legend,
  setLegend: (legend: Legend) => void
  setError: (error: Error) => void
  setErrorMsg: (msg: string) => void
}

export const SubjectVisualContext = createContext<SubjectVisualContext>({
  width: 0,
  height: 0,
  visualData: undefined,
  onUpdateKindPage: (kind: string, page: number) => {
    /* no-op */
  },
  legend: {
    visible: false,
    activeTab: '',
  },
  setLegend: (legend: Legend) => {
    /* no-op */
  },
  setError: (error: Error) => {
    /* no-op */
  },
  setErrorMsg: (msg: string) => {
    /* no-op */
  }
})
