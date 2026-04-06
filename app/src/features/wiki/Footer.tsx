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
import * as common from '@evotempus/utils'
import wikiLogo from '@evotempus/assets/images/wikipedia-logo-with-label.svg'

type FooterProps = {
  linkId: string
}

export const Footer: React.FunctionComponent<FooterProps> = (props: FooterProps) => {

  return (
    <div id="wiki-footer">
      <a id="wiki-footer-logo" href={common.wikiLink + props.linkId}
         target="_blank" rel="noopener noreferrer">
        <img src={wikiLogo} alt="Wikipedia"/>
      </a>
      <p id="link-instruction-arrow">&rarr;</p>
      <p id="link-instruction-text">To read further, click here</p>

      <p id="unit-defn" className="fade-in">
        <span>
          <a href={common.wikiLink + "Year#SI_prefix_multipliers"} target="_blank" rel="noopener noreferrer">
            Ma: 1 million years
          </a>
        </span>
        <span>
          <a href={common.wikiLink + "Year#SI_prefix_multipliers"} target="_blank" rel="noopener noreferrer">
            ka: 1 thousand years
          </a>
        </span>
      </p>
    </div>
  )
}
