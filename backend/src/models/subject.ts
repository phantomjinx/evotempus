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

import mongoose, { Document, ValidatorProps } from 'mongoose'
import { HintModel } from './hint'

export interface ISubject extends Document<string> {
  name: string,
  kind: string,
  category: string,
  link: string,
  from: number,
  to:   number,
  icon: string,
  tags: string[]
}

const SubjectSchema = new mongoose.Schema<ISubject>({
  _id: {type: String, required: true},
  name: String,
  kind: {
    type: String,
    validate: {
      validator: async (v: string) => {
        // Use .exists() for performance, which returns { _id: ... } or null
        const exists = await HintModel.exists({
          _id: v,
          type: 'Kind'
        })
        // Explicitly return a boolean to satisfy TypeScript
        return exists !== null
      },
      message: (props: ValidatorProps) => `${props.value} is an invalid Kind`
    }
  },
  category: {
    type: String,
    validate: {
      validator: async (v: string) => {
        const exists = await HintModel.exists({ _id: v })
        return exists !== null
      },
      message: (props: ValidatorProps) => `${props.value} is an invalid Category`
    },
    required: true
  },
  link: String,
  from: Number,
  to:   Number,
  icon: String,
  tags: [{
    type: String,
    validate: {
      validator: async (v: string) => {
        const exists = await HintModel.exists({ _id: v })
        return exists !== null
      },
      message: (props: ValidatorProps) => `${props.value} is an invalid Tag`
    },
  }],
},
{ versionKey: 'version' })

export const SubjectModel = mongoose.model<ISubject>('Subject', SubjectSchema)
