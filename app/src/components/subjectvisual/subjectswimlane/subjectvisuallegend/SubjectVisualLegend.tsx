import React, { useState } from 'react'
import "react-pagination-js/dist/styles.css" // import css
import { FilteredCategory, Legend } from '@evotempus/types'
import './SubjectVisualLegend.scss'
import { initCategoryNodes } from './subject-visual-legend-service'
import { CategoryNode } from './globals'
import { LegendKindTabs } from './LegendKindTabs'

type SubjectVisualLegendProps = {
  height: number
  legend: Legend
  onUpdateLegend: (legend: Legend) => void
  categories: FilteredCategory[]
  onUpdateCategories: (categories: FilteredCategory[]) => void
  displayedCategoryNames: string[]
}

export const SubjectVisualLegend: React.FunctionComponent<SubjectVisualLegendProps> = (props: SubjectVisualLegendProps) => {

  const [categoryNodes, setCategoryNodes] = useState<CategoryNode[]>(initCategoryNodes(props.displayedCategoryNames, props.categories))
  const [totalPerPage] = useState<number>(Math.min(10, (props.height * 0.5) / 40))
  const [activeTab] = useState<string>(props.legend.activeTab)

  const close = () => {
    props.onUpdateLegend({
      activeTab: activeTab,
      visible: false
    })
  }

  const onChangedCategories = (changedCategories: CategoryNode[]) => {
    const categories = [...props.categories]

    for (let i = 0; i < changedCategories.length; ++i) {
      const cc = changedCategories[i]
      const c = categories.find(category => category.name === cc.name)
      if (!c) continue

      c.filtered = cc.filtered
    }

    props.onUpdateCategories(categories)
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
            legend={props.legend} onUpdateLegend={props.onUpdateLegend}
            onUpdateCategoryNodes={setCategoryNodes}
            onChangedCategories={onChangedCategories}
          />
        </div>
      </div>
    </div>
  )
}
