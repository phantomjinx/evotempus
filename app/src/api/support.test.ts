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

import { Hint } from '@evotempus/types'

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
const hints: Hint[] = [
  { _id: 'Animal', colour: '#b36229', link: 'Animal', order: 5, parent: '', type: 'Kind' },
  { _id: 'Event', colour: '#ff8686', link: '', order: 1, parent: '', type: 'Kind' },
  { _id: 'Geology', colour: '#919191', link: 'Geology', order: 6, parent: '', type: 'Kind' },
  { _id: 'Agmata', colour: '', link: 'Agmata', order: 0, parent: 'Animal', type: 'Category' },
  { _id: 'Agnatha', colour: '', link: 'Agnatha', order: 0, parent: 'Animal', type: 'Category' },
  { _id: 'Algae', colour: '#901236', link: 'Algae', order: 0, parent: 'Plant', type: 'Category' },
  { _id: 'Vetulicolia', colour: '', link: 'Vetulicolia', order: 0, parent: 'Animal', type: 'Category' },
  { _id: 'Zosterophyllophyta', colour: '', link: 'Zosterophyllophyta', order: 0, parent: 'Plant', type: 'Category' },
  { _id: 'Walking-With-Beasts', colour: '', link: 'Walking_with_Beasts', order: 0, parent: '', type: 'Tag' },
  { _id: 'Walking-With-Dinosaurs', colour: '', link: 'Walking_with_Dinosaurs', order: 0, parent: '', type: 'Tag' },
  { _id: 'Walking-With-Monsters', colour: '', link: 'Walking_With_Monsters', order: 0, parent: '', type: 'Tag' },
]

export { hints }
