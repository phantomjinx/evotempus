/*
 * Copyright (C) 2023 Paul G. Richardson
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

export function toBoolean(value: string|undefined, defaultVal: boolean) {
  if (!value) {
    return defaultVal
  }

  switch(value.toLowerCase().trim()) {
    case "true": case "yes": case "1": return true
    case "false": case "no": case "0": case null: return false
    default: return Boolean(value)
  }
}

export function displayName(id: string) {
  // Replace hypens with spaces
  const name = id.replace(/-/g, " ")

  // Capitalize all words
  const s = name.toLowerCase().split(' ') || []
  for (let i = 0; i < s.length; i++) {
    if (! s[i]) continue

    const firstLetter = s[i]?.charAt(0).toUpperCase()
    const remaining = s[i]?.substring(1) || ''

    // Assign it back to the array
    s[i] = firstLetter + remaining
  }

  return s.join(' ')
}

export function parseNumber(numStr: string, id: string) {
  const n = parseInt(numStr.trim())
  if (isNaN(n)) {
    throw "ERROR: Cannot convert 'from' value: " + numStr.trim() + " for id: " + id
  }

  return n
}

export function valueUnknown(value: string) {
  return value == '<>'
}
