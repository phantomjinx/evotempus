import React, { useEffect, useState } from 'react'
import './Tabs.scss'

interface TabsProps {
  children: JSX.Element[]
  activeTab?: string
  onTabClicked?: (name: string)  => void
}

export const Tabs: React.FunctionComponent<TabsProps> = (props: TabsProps) => {
  const [activeTab, setActiveTab] = useState<string>(props.activeTab ?? '')

  useEffect(() => {
    //
    // Skip to the first populated tab if activeTab is empty
    //
    if (!props.activeTab || props.activeTab.length === 0) {
      let title = props.children[0].props.title
      for (let i = 0; i < props.children.length; ++i) {
        if (props.children[i].props.entryCount > 0) {
          title = props.children[i].props.title
          break
        }
      }
      setActiveTab(title)
    }
  }, [props.children])

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
              activeTab={activeTab}
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
          if (child.props.title !== activeTab) {
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
    <li key='{props.title}' className={className} onClick={onClick}>
      {props.title}
    </li>
  )
}
