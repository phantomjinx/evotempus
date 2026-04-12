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

import React, { useMemo, useState } from 'react'
import { FilteredCategory, Legend } from '@evotempus/types'
import './SubjectVisualLegend.scss'
import { initCategoryNodes } from './subject-visual-legend-service'
import { LegendKindTabs } from './LegendKindTabs'
import { logDebug } from '@evotempus/utils'

type SubjectVisualLegendProps = {
  height: number
  legend: Legend
  onUpdateLegend: (legend: Legend) => void
  categories: FilteredCategory[]
  onUpdateCategoryFilter: (changedCategories: FilteredCategory[]) => void
  displayedCategoryNames: string[]
}

export const SubjectVisualLegend: React.FunctionComponent<SubjectVisualLegendProps> = (props: SubjectVisualLegendProps) => {

  const [totalPerPage] = useState<number>(Math.min(10, (props.height * 0.5) / 40))
  const [activeTab] = useState<string>(props.legend.activeTab)

  // Track what the user has clicked in this session.
  const [pendingEdits, setPendingEdits] = useState<Record<string, boolean>>({})

  // Recalculates automatically if the interval changes OR if the user clicks
  const categoryNodes = useMemo(() => {
    const baseNodes = initCategoryNodes(props.displayedCategoryNames, props.categories)

    return baseNodes.map(node => {
      // If the user clicked this node, use their pending edit. Otherwise, use global truth.
      if (pendingEdits[node.name] !== undefined) {
        return { ...node, filtered: pendingEdits[node.name] }
      }
      return node
    })
  }, [props.displayedCategoryNames, props.categories, pendingEdits])

  // Record the flip in state of the given category.
  const toggleNode = (categoryName: string, filtered: boolean) => {
    setPendingEdits(prev => ({
      ...prev,
      [categoryName]: !filtered
    }))
  }

  const hasPendingChanges = Object.keys(pendingEdits).length > 0

  const close = () => {
    props.onUpdateLegend({
      activeTab: activeTab,
      visible: false
    })
  }

  // Merge the pendingEdits into the categories
  const applyFilter = () => {
    logDebug({prefix: 'SubjectVisualLegend', message: 'Applying Filter ...'})

    const updatedCategories = props.categories.map(cat => ({
      ...cat,
      filtered: pendingEdits[cat.name] !== undefined ? pendingEdits[cat.name] : cat.filtered
    }))

    props.onUpdateCategoryFilter(updatedCategories)
    setPendingEdits({})
  }

  return (
    <div id="subject-visual-legend" className={props.legend.visible ? 'show' : 'hide'}>
      <div className="subject-visual-legend-content">
        <div className="subject-visual-legend-title-row-1">
          <button
            className="subject-visual-legend-closebtn fas fa-times"
            onClick={close}>
          </button>
        </div>
        <div className="subject-visual-legend-title-row-2">
          <div className="subject-visual-legend-text">
            <p>
              Select icons to filter then click
              <i className="subject-visual-legend-text-apply fas fa-check-circle"></i>
            </p>
          </div>
        </div>

        <div className="subject-visual-legend-kinds">
          <LegendKindTabs
            height={props.height} categoryNodes={categoryNodes} totalPerPage={totalPerPage}
            legend={props.legend} hasPendingChanges={hasPendingChanges}
            onUpdateLegend={props.onUpdateLegend}
            onToggleNode={toggleNode}
            onApplyFilter={applyFilter}
          />
        </div>
      </div>
    </div>
  )
}
