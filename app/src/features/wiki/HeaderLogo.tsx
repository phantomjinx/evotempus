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
import geoclock from '@evotempus/assets/images/geologic-clock.png'

export const HeaderLogo: React.FunctionComponent = () => {

  return (
    <React.Fragment>
      <a id="wiki-header-logo" href="https://en.wikipedia.org/wiki/Geologic_time_scale"
        target="_blank" rel="noopener noreferrer">
        <img src={geoclock} alt="geo-clock"/>
      </a>
    </React.Fragment>
  )
}
