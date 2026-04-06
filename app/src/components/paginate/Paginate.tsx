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

type PaginateProps = {
  currentPage: number
  totalItems: number
  pageSize: number
  onPageChange: (page: number) => void
}

export const Paginate: React.FunctionComponent<PaginateProps> = (props: PaginateProps) => {
  const totalPages = Math.ceil(props.totalItems / props.pageSize)

  const getPageNumbers = (): (number|string)[] => {
    const min = 1
    const max = totalPages
    const windowHalfSize = 1 // size of window either side of currentPage

    // pageSize <= 7 then can show all 1 2 3 [4] 5 6 7
    // pageSize >7 then 1 ... 3 [4] 5 ... 8

    // create a sliding window
    let left = props.currentPage - windowHalfSize
    let right = props.currentPage + windowHalfSize

    // [1] 2 3 4 5 6 7 8 => [1] 2 3 4 ... 8
    // 1 [2] 3 4 5 6 7 8 => 1 [2] 3 4 ... 8
    // 1 2 [3] 4 5 6 7 8 => 1 2 [3] 4 ... 8
    // 1 2 3 [4] 5 6 7 8 => 1 ... 3 [4] 5 ... 8
    // 1 2 3 4 [5] 6 7 8 => 1 ... 4 [5] 6 ... 8
    // 1 2 3 4 5 [6] 7 8 => 1 ... 5 [6] 7 8
    // 1 2 3 4 5 6 [7] 8 => 1 ... 5 6 [7] 8

    // The "wall" where an ellipsis is crushed is min + 1 (left) and max - 1 (right)
    if (left <= min + 1) {
      // (min + 1) - left calculates how many numbers fell out of bounds.
      // The + 1 absorbs the mass of the destroyed left ellipsis.
      const leftOverflow = (min + 1) - left + 1
      right = right + leftOverflow
      left = min + 1 // Anchor to the wall
    }
    else if (right >= max - 1) {
      const rightOverflow = right - (max - 1) + 1
      left = left - rightOverflow
      right = max - 1 // Anchor to the wall
    }

    // If expanding the right wall pushed the left wall
    // too far on small arrays
    if (left < min + 1) left = min + 1

    const inTheWindow = (v: number) => v >= left && v <= right
    const onWindowBoundary = (v: number) => v === (left - 1) || v === (right + 1)
    const nextToMinOrMax = (v: number) => v === (min + 1) || v === (max - 1)

    const labels: (number|string)[] = []
    for (let i = 1; i <= max; ++i) {
      if (i === props.currentPage) {
        labels.push(i)
        continue
      }

      if (i === 1 || i === max) {
        // Always render min and max
        labels.push(i)
        continue
      }

      if (inTheWindow(i)) {
        labels.push(i)
        continue
      }

      if (onWindowBoundary(i)) {
        if (nextToMinOrMax(i)) {
          labels.push(i)
        } else {
          labels.push(`...`)
        }
        continue
      }
    }
    return labels
  }

  return (
    <nav aria-label="Pagination">
      {
        <ul className="pagination pagination-sm mb-0 justify-content-center">
         {
           getPageNumbers().map((symbol: number|string, index: number) => {
            if (typeof symbol === 'number') {
              const pageNum = Number(symbol)
              const isActive = pageNum === props.currentPage

              return (
                <li key={pageNum} className={`page-item ${isActive ? 'active' : ''}`}>
                  <button key={symbol} className="page-link"
                    onClick={() => props.onPageChange(symbol)}
                    aria-current={isActive ? 'page' : undefined}
                    type="button"
                  >
                    {pageNum}
                  </button>
                </li>
              )
             } else {
               return (
                 <li key={`${symbol}-${index}`} className="page-item disabled">
                   {symbol}
                 </li>
               )
             }
           })
         }
       </ul>
      }
    </nav>
  )
}
