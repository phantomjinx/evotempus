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

import { useState } from 'react'

export function usePrevious<T>(value: T): T | undefined {
  const [current, setCurrent] = useState(value)
  const [previous, setPrevious] = useState<T | undefined>(undefined)

  // If the incoming value doesn't match tracked current value,
  // it means a change just happened. Shift the values down!
  if (value !== current) {
    setPrevious(current)
    setCurrent(value)
  }

  return previous
}
