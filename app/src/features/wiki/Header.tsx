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
