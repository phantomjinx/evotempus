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

import mongoose, { ValidatorProps } from 'mongoose'
import { HintModel } from './hint'

const Schema = mongoose.Schema

export interface IInterval {
  _id: string,
  name: string,
  kind: string,
  from: number,
  to:   number,
  parent?: string,
  children?: string[],
  tags: string[]
}

export const IntervalSchema = new Schema<IInterval>({
  _id: {type: String, required: true},
  name: String,
  kind: {type: String, enum: ['Root', 'SuperEon', 'Eon', 'Era', 'Period', 'Sub-Period', 'Epoch', 'Age']},
  from: Number,
  to:   Number,
  parent: { type: String, ref: 'Interval' },
  children: [{ type: String, ref: 'Interval' }],
  tags: [{
    type: String,
    validate: {
      validator: (v: string) => {
        console.log(`Validating ${v} against hints`)
        return HintModel.findById(v)
      },
      message: (props: ValidatorProps) => `${props.value} is an invalid Tag`
    },
  }],
},
{ versionKey: 'version' })

export const IntervalModel = mongoose.model('Interval', IntervalSchema)
