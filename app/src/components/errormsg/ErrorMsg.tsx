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

import React from 'react'
import './ErrorMsg.scss'

interface ErrorProps {
  errorMsg?: string
  error?: Error
}

export const ErrorMsg: React.FunctionComponent<ErrorProps> = (props: ErrorProps) => {
  return (
    <div className='error-msg'>
      <h3>Error Occurred:</h3>
      <h4>{props.errorMsg}</h4>

      {
        props.error && (
          <details style={{ whiteSpace: 'pre-wrap' }} open={true}>
            {props.error.stack}
          </details>)
      }
    </div>
  )
}
