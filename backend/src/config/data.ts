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
export interface EvoDataConfig {
  intervals: string,
  intervalTopics: string,
  subjects:  string[],
  hints: string,
  tags: string
}

export const evoDataConfig: EvoDataConfig = {
  intervals: 'data/intervals.dat',
  intervalTopics: 'data/interval-topics.dat',
  subjects:  ['data/subjects.dat', 'data/PBDB-EVO'],
  hints: 'data/hints.dat',
  tags: 'data/tags'
}
