import React, { useState } from 'react'
import Pagination from 'react-pagination-js'
import {color as d3Color, RGBColor} from 'd3-color'
import { hintService } from '@evotempus/api'
import { Tabs } from '@evotempus/components'
import { FilteredCategory, Legend } from '@evotempus/types'
import { CategoryNode } from './globals'
import { identifier, wikiLink } from '@evotempus/utils'

interface KindPage {
  kind: string
  page: number
}

type LegendKindTabsProps = {
  height: number
  categoryNodes: CategoryNode[]
  totalPerPage: number
  legend: Legend
  onUpdateLegend: (legend: Legend) => void
  onUpdateCategoryNodes: (categoryNodes: CategoryNode[]) => void
  onChangedCategories: (categoryNodes: CategoryNode[]) => void
}

export const LegendKindTabs: React.FunctionComponent<LegendKindTabsProps> = (props: LegendKindTabsProps) => {

  const totalPerPage = 8

  const [kinds, _] = useState<string[]>(hintService.getKindIds())

  const [changedNodes, setChangedNodes] = useState<CategoryNode[]>([])
  const [kindPages, setKindPages] = useState<KindPage[]>([])

  const cacheActiveTab = (tabName: string) => {
    console.log(`Caching Active Tab: ${tabName}`)
    props.onUpdateLegend({
      activeTab: tabName,
      visible: props.legend.visible
    })
  }

  const filterCategory = (event: React.MouseEvent<HTMLDivElement, MouseEvent>, categoryNode: CategoryNode) => {
    // Make a shallow copy of the keys and filtered keys
    let categoryNodes = [...props.categoryNodes]
    let changed = [...changedNodes]

    // Make a shallow copy of the symbol to mutate
    let keyIdx = categoryNodes.indexOf(categoryNode)
    let ks = {...categoryNodes[keyIdx]}

    // Modify the filtered property
    ks.filtered = ! categoryNode.filtered

    // Put it back into key array.
    categoryNodes[keyIdx] = ks

    // Add / Remove from changed
    let chgIdx = changed.indexOf(categoryNode)
    if (chgIdx < 0) {
      // Not been changed before so add to changed
      changed.push(ks)
    } else {
      // Already in changed so being changed back
      // so remove from changed
      changed.splice(chgIdx, 1)
    }

    setChangedNodes(changed)
    props.onUpdateCategoryNodes(categoryNodes)
  }

  const applyFilter = () => {
    props.onChangedCategories(changedNodes)
  }

  /*
   * Adds a paginate element to the kind block if the number of
   * categories is larger than the {totalPerPage} constant
   */
  const paginateKindBlock = (kind: string, items: JSX.Element[]): {pagination: JSX.Element, items: JSX.Element[]} => {
    if (items.length < totalPerPage) {
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
      <Pagination
        currentPage={currentPage}
        totalSize={totalSize}
        sizePerPage={totalPerPage}
        changeCurrentPage={changePageFn}
        theme='border-bottom'
      />
    ), items: items}
  }

  const renderKindBlock = (kind: string, categoryNodes: CategoryNode[]): JSX.Element => {
    let items: JSX.Element[] = []
    const height = (props.height * 0.5) / props.totalPerPage

    if (categoryNodes.length === 0) {
      items.push(
        // Ignore the entryCount attribute not being a recognised property of <div>
        // @ts-ignore
        <div title={kind} entryCount={0} className="subject-visual-legend-paginate">
          <div className="subject-visual-legend-items">
            <p className="subject-legend-content-none-found">No categories</p>
          </div>
        </div>
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
                 onClick = {(event) => filterCategory(event, categoryNode)}>
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
      // Ignore the entryCount attribute not being a recognised property of <div>
      // @ts-ignore
      <div title={kind} entryCount={items.length}>
        {p.pagination}
        <div className="subject-visual-legend-items">
          <ul className="subject-visual-legend-items-inner">
            {items}
          </ul>
        </div>
        <div className="subject-visual-legend-footer">
          <div
            id="subject-visual-legend-apply"
            className={changedNodes.length > 0 ? 'subject-visual-legend-apply-show' : 'subject-visual-legend-apply-hide'}>
            <span className="subject-visual-legend-apply-tooltip">Apply Filter</span>
            <button
              className="subject-visual-legend-apply-btn fas fa-check-circle"
              onClick={(event) => applyFilter()}>
            </button>
          </div>
        </div>
      </div>
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
