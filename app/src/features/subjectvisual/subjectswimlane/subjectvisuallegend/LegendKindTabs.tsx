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

import React, { JSX, useState } from 'react'
import {color as d3Color, RGBColor} from 'd3-color'
import { hintService } from '@evotempus/api'
import { Paginate, TabPane, Tabs } from '@evotempus/components'
import { Legend } from '@evotempus/types'
import { CategoryNode } from './globals'
import { identifier, logDebug, wikiLink } from '@evotempus/utils'

interface KindPage {
  kind: string
  page: number
}

type LegendKindTabsProps = {
  height: number
  categoryNodes: CategoryNode[]
  totalPerPage: number
  legend: Legend
  hasPendingChanges: boolean
  onUpdateLegend: (legend: Legend) => void
  onToggleNode: (categoryName: string, currentlyFiltered: boolean) => void
  onApplyFilter: () => void
}

export const LegendKindTabs: React.FunctionComponent<LegendKindTabsProps> = (props: LegendKindTabsProps) => {

  const totalPerPage = 8
  const kinds = hintService.getKindIds()

  const [kindPages, setKindPages] = useState<KindPage[]>([])

  const cacheActiveTab = (tabName: string) => {
    logDebug({prefix: 'LegendKindTabs', message: `Caching Active Tab: ${tabName}`})
    props.onUpdateLegend({
      activeTab: tabName,
      visible: props.legend.visible
    })
  }

  const applyFilter = () => {
    logDebug({prefix: 'LegendKindTabs', message: 'Applying Filter ...'})
    props.onApplyFilter()
  }

  /*
   * Adds a paginate element to the kind block if the number of
   * categories is larger than the {totalPerPage} constant
   */
  const paginateKindBlock = (kind: string, items: JSX.Element[]): {pagination: JSX.Element, items: JSX.Element[]} => {
    if (items.length <= totalPerPage) {
      return ({pagination: <></>, items: items})
    }

    const totalSize = items.length
    const kindPage = kindPages.find((kindPage) => kindPage.kind === kind)
    const currentPage = kindPage?.page ?? 1

    const offset = (currentPage - 1) * totalPerPage
    const changePageFn = (newPage: number) => {
      const kp = kindPages.filter((kindPage) => kindPage.kind !== kind)
      kp.push({kind: kind, page: newPage})
      setKindPages(kp)
    }

    items = items.slice(offset, offset + totalPerPage)

    return {pagination: (
      <Paginate
        currentPage={currentPage}
        totalItems={totalSize}
        pageSize={totalPerPage}
        onPageChange={changePageFn}
      />
    ), items: items}
  }

  const renderKindBlock = (kind: string, categoryNodes: CategoryNode[]): JSX.Element => {
    let items: JSX.Element[] = []
    const height = (props.height * 0.5) / props.totalPerPage

    if (categoryNodes.length === 0) {
      items.push(
        <li key={kind} title={kind} className="subject-visual-legend-paginate">
          <div className="subject-visual-legend-items">
            <p className="subject-legend-content-none-found">No categories</p>
          </div>
        </li>
      )
    }
    else {
      for (const categoryNode of categoryNodes) {
        let symText: JSX.Element
        if (categoryNode.link === '') {
          symText = (
            <span style = {{opacity: categoryNode.filtered ? '0.2' : '1'}}>
              {categoryNode.name}
            </span>
          )
        } else {
          symText = (
            <a
              href = {wikiLink + categoryNode.link}
              style = {{opacity: categoryNode.filtered ? '0.2' : '1'}}
              target = "_blank" rel="noopener noreferrer">
              {categoryNode.name}
            </a>
          )
        }

        let zeroColour = d3Color(categoryNode.colour) as RGBColor
        zeroColour = zeroColour.brighter().brighter()

        items.push(
          <li key={kind + '-' + categoryNode.name}>
            <div style = {{height: height + 'px', width: height + 'px'}}
                 onClick = {() => props.onToggleNode(categoryNode.name, categoryNode.filtered)}>
              <svg height = {height} width = {height}>
                <defs>
                  <radialGradient cx = "50%" cy = "50%" r = "85%"
                    id = { "legend-gradient-" + identifier(categoryNode.name) }>
                    <stop offset = "0%" stopColor = {zeroColour.formatRgb()}/>
                    <stop offset = "90%" stopColor = {categoryNode.colour}/>
                  </radialGradient>
                </defs>
                <rect
                  x = {(height - (height * 0.75)) / 2}
                  y = {(height - (height * 0.75)) / 2}
                  width = {height * 0.75}
                  height = {height * 0.75}
                  fill = {"url(#legend-gradient-" + identifier(categoryNode.name) + ")"}
                  strokeWidth = {categoryNode.filtered ? '1' : '0'}
                  stroke = {categoryNode.filtered ? 'black' : ''}
                  opacity = {categoryNode.filtered ? '0.2' : '1'}
                />
              </svg>
            </div>
            {symText}
          </li>
        )
      }
    }

    const p = paginateKindBlock(kind, items)
    items = p.items

    return (
      <TabPane key={kind} title={kind} entryCount={items.length}>
        <div className="subject-visual-legend-items">
          <ul className="subject-visual-legend-items-inner">
            {items}
          </ul>
        </div>
        {p.pagination}
        <div className="subject-visual-legend-footer">
          <div
            id="subject-visual-legend-apply"
            className={props.hasPendingChanges ? 'subject-visual-legend-apply-show' : 'subject-visual-legend-apply-hide'}>
            <span className="subject-visual-legend-apply-tooltip">Apply Filter</span>
            <button
              className="subject-visual-legend-apply-btn fas fa-check-circle"
              onClick={() => applyFilter()}>
            </button>
          </div>
        </div>
      </TabPane>
    )
  }

  // Create the paginated tabs of categories
  const renderKindTabs = (): JSX.Element[] => {
    const tabs: JSX.Element[] = []

    for (const kind of kinds) {
      const kindSymbols = props.categoryNodes.filter(categoryNode => kind === categoryNode.kind)
      tabs.push(renderKindBlock(kind, kindSymbols))
    }

    return tabs
  }

  return (
    <Tabs
      activeTab={props.legend.activeTab}
      onTabClicked={cacheActiveTab}>
      {renderKindTabs()}
    </Tabs>
  )
}
