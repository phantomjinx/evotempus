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
