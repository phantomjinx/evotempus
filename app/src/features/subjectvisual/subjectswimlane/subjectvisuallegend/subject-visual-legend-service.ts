import { FilteredCategory } from '@evotempus/types'
import { hintService } from '@evotempus/api'
import { CategoryNode } from './globals'

export function initCategoryNodes(displayedCategories: string[], categories: FilteredCategory[]): CategoryNode[] {
  const categoryNodes: CategoryNode[] = []

  for (let i = 0; i < displayedCategories.length; ++i) {
    const category = categories.find(c => c.name === displayedCategories[i])
    if (!category) continue

    const colour = hintService.calcColour(category.name)
    const hint = hintService.getHint(category.name)
    const categoryNode = {
      kind: hint.parent || '',
      colour: colour,
      link: hint.link || '',
      name: category.name,
      filtered: category.filtered
    }

    categoryNodes.push(categoryNode)
  }

  return categoryNodes
}
