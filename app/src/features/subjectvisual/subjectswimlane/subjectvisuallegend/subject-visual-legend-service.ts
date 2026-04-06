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
