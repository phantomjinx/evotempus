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

import { Interval, Subject, Topic } from '@evotempus/types'
import geoclockIcon from '@evotempus/assets/images/geologic-clock-icon32.png'
import topicIcon from '@evotempus/assets/images/topic-icon.png'
import animalIcon from '@evotempus/assets/images/animal-icon.png'
import eventIcon from '@evotempus/assets/images/event-icon.png'
import geologyIcon from '@evotempus/assets/images/geology-icon.png'
import microIcon from '@evotempus/assets/images/micro-icon.png'
import fungusIcon from '@evotempus/assets/images/fungus-icon.png'
import plantIcon from '@evotempus/assets/images/plant-icon.png'

export const million = 1000000
export const thousand = 1000
export const wikiLink = 'https://en.wikipedia.org/wiki/'

export function displayYear(year: number): string {
  if (Math.abs(year) > million)
    return year / million + 'Ma'
  else if (Math.abs(year) > thousand)
    return year / thousand + 'ka'
  else
    return `${year}`
}

export function present(year: number) {
  return year === 2030 ? new Date().getFullYear() : displayYear(year)
}

export function identifier(text: string) {
  return text.replace(/\s/g, '-').toLowerCase()
}

export function idToTitle(id: string) {
  // Replace hypens with spaces
  const name = id.replace(/-/g, ' ')

  // Capitalize all words
  const s = name.toLowerCase().split(' ')
  for (let i = 0; i < s.length; i++) {
    // Assign it back to the array
    s[i] = s[i].charAt(0).toUpperCase() + s[i].substring(1)
  }

  return s.join(' ')
}

export function isObject(value: unknown): value is object {
  const type = typeof value
  return value != null && (type === 'object' || type === 'function')
}

export function isInterval(value: unknown): value is Interval {
  if (! isObject(value)) return false
  return 'parent' in value
}

export function isSubject(value: unknown): value is Subject {
  if (! isObject(value)) return false
  return 'category' in value
}

export function isTopic(value: unknown): value is Topic {
  if (! isObject(value)) return false
  return 'topicTarget' in value
}

export function getListIcon(object: unknown): string {
  if (isInterval(object)) {
    return geoclockIcon
  } else if (isTopic(object)) {
    return topicIcon
  } else if (isSubject(object)) {
    const subject = object as Subject
    switch (subject.kind) {
      case 'Animal':
        return animalIcon
      case 'Event':
        return eventIcon
      case 'Geology':
        return geologyIcon
      case 'Micro':
        return microIcon
      case 'Fungus':
        return fungusIcon
      case 'Plant':
        return plantIcon
    }
  }

  return geoclockIcon
}

export function deepEqual(object1: unknown, object2: unknown) {
  return JSON.stringify(object1) === JSON.stringify(object2)
}
