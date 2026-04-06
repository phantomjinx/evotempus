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
import { Topic, TopicRequest, TopicTarget } from '@evotempus/types'
import * as common from '@evotempus/utils'
import { HeaderCloseButton } from './HeaderCloseButton'
import { HeaderLogo } from './HeaderLogo'

type HeaderProps = {
  topicTarget: TopicTarget
  toggleWiki: (event: any, type?: string) => void
}

export const Header: React.FunctionComponent<HeaderProps> = (props: HeaderProps) => {

  const displayDates = () => {
    if (! props.topicTarget) {
      return ''
    }

    return "from approximately "
      + common.present(props.topicTarget.from)
      + " to " + common.present(props.topicTarget.to)
  }

  const headerTitle = (): React.ReactNode => {
    let title = ''
    let className = ''
    if (! props.topicTarget) {
      title = 'None'
      className = 'disappear'
    } else {
      title = props.topicTarget.name + " " + displayDates()
      className = 'fade-in'
    }

    return (
      <p id="wiki-header-title" className={className}>{title}</p>
    )
  }

  return (
    <div id="wiki-header">
      <HeaderCloseButton toggleWiki={props.toggleWiki}/>
      <HeaderLogo/>
      {headerTitle()}
    </div>
  )
}
