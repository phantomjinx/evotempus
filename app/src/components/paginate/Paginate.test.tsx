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

import { render, screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom'
import { Paginate } from './Paginate'

describe('Paginate', () => {
  const pageSize = 10
  const mockedPageChange = jest.fn()

  // Clear the mock function's memory before every single test run
  // so click counts don't bleed over into the next test
  beforeEach(() => {
    mockedPageChange.mockClear()
  })

  const cases = [
    { page: 1, totalPages: 7, description: 'page 1' },
    { page: 4, totalPages: 7, description: 'page 4' },
    { page: 7, totalPages: 7, description: 'page 7' },
    { page: 2, totalPages: 8, description: 'page 2' },
    { page: 4, totalPages: 8, description: 'page 4' },
    { page: 6, totalPages: 8, description: 'page 6' },
    { page: 1, totalPages: 10, description: 'page 1' },
    { page: 5, totalPages: 10, description: 'page 5' },
    { page: 10, totalPages: 10, description: 'page 10' },
  ]

  // Map 'totalPages' into the test description so it's accurate in the console!
  test.each(cases)('renders $totalPages pages correctly at $description', ({ page, totalPages }) => {
    // Dynamically calculate totalItems so the component math works out perfectly
    const totalItems = totalPages * pageSize

    render(
      <Paginate
        currentPage={page}
        totalItems={totalItems}
        pageSize={pageSize}
        onPageChange={mockedPageChange}
      />
    )

    // Is the current page rendered as a button, and does it have the aria-current attribute?
    const activeButton = screen.getByRole('button', { name: String(page), current: 'page' })
    expect(activeButton).toBeInTheDocument()

    // The Accordion Fix
    // Grab all the list items (both buttons and ellipses are wrapped in <li> tags)
    const listItems = screen.getAllByRole('listitem')

    // If total pages is <= 7, there should be exactly that many slots.
    // If > 7, our sliding window guarantees exactly 7 slots.
    const expectedSlots = totalPages <= 7 ? totalPages : 7
    expect(listItems).toHaveLength(expectedSlots)

    // The Interaction
    // Let's find page number 1 and click it (unless we are ALREADY on page 1,
    // in which case we'll click the last page so we know the button isn't disabled)
    const buttonToClick = page === 1 ? String(totalPages) : '1'
    const targetButton = screen.getByRole('button', { name: buttonToClick })

    fireEvent.click(targetButton)
    expect(mockedPageChange).toHaveBeenCalledWith(Number(buttonToClick))
    expect(mockedPageChange).toHaveBeenCalledTimes(1)
  })
})
