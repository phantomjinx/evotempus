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

import React, { JSX, useState } from 'react'
import './Tabs.scss'

interface TabsProps {
  children: JSX.Element[]
  activeTab?: string
  onTabClicked?: (name: string)  => void
}

export const Tabs: React.FunctionComponent<TabsProps> = (props: TabsProps) => {
  const [activeTab, setActiveTab] = useState<string>(props.activeTab ?? '')

  // Calculate the active tab on the fly during render.
  // If the user hasn't clicked a tab yet, we find the first populated one.
  let currentActiveTab = activeTab
  if (!currentActiveTab) {
    const firstPopulated = props.children.find(child => child.props.entryCount > 0)
    currentActiveTab = firstPopulated ? firstPopulated.props.title : (props.children[0]?.props.title ?? '')
  }

  const onClickTabItem = (tab: string) => {
    setActiveTab(tab)

    if (props.onTabClicked) {
      props.onTabClicked(tab)
    }
  }

  return (
    <div className='tabs'>
      <div className='tab-header'>
        <ol className='tab-list'>
          {props.children.map((child: JSX.Element, index: number) => {
            const title: string = child.props.title
            const entryCount: number = child.props.entryCount
            return <Tab
              activeTab={currentActiveTab}
              title={title}
              entryCount={entryCount}
              selectTab={onClickTabItem}
              key={index}
            />
          })}
        </ol>
      </div>
      <div className='tab-content'>
        {props.children.map((child: JSX.Element) => {
          if (child.props.title !== currentActiveTab) {
            return undefined
          }
          return child.props.children
        })}
      </div>
    </div>
  )
}

interface TabProps {
  title: string
  entryCount: number
  activeTab?: string
  selectTab: (title: string) => void
}

export const Tab: React.FunctionComponent<TabProps> = (props: TabProps) => {
  const onClick = () => {
    const { title, selectTab } = props
    selectTab(title)
  }

  let className = 'tab-list-item'
  if (props.activeTab === props.title) {
    className += ' tab-list-active'
  }

  return (
    <li id={props.title} key={props.title} className={className} onClick={onClick}>
      {props.title}
    </li>
  )
}

export interface TabPaneProps {
  title: string
  entryCount: number
  className?: string
  children: React.ReactNode
}

export const TabPane: React.FC<TabPaneProps> = ({ className, children }) => {
  return <div className={className}>{children}</div>
}
