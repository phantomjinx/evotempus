import React, { useCallback, useRef } from 'react'
import { useEffect, useState } from 'react'

import './App.scss'
import { AppContext } from './context'
import { fetchService, hintService } from '@evotempus/api'
import { FilteredCategory, Interval, Subject, Topic, TopicRequest, TopicTarget, TopicType } from '@evotempus/types'
import { IntervalVisual, Search, HelpPage, Wiki } from '@evotempus/components'
import { SubjectVisual } from '@evotempus/components'
import {  consoleLog, present, isSubject, isInterval } from '@evotempus/utils'
import wikiLogoV2 from '@evotempus/assets/images/wikipedia-logo-v2.svg'
import geoclock from '@evotempus/assets/images/geologic-clock.png'
import { Loading } from '@evotempus/layout'

//
// Ensure hints and categories initialised only once
//
let initialised = false

export const App: React.FunctionComponent = () => {
  const [interval, setInterval] = useState<Interval | undefined>(undefined)
  const [subject, setSubject] = useState<Subject | undefined>(undefined)
  const [filteredCategories, setFilteredCategories] = useState<FilteredCategory[]>([])

  const [errorMsg, setErrorMsg] = useState<string | undefined>(undefined)
  const [error, setError] = useState<Error | undefined>(undefined)
  const [help, showHelp] = useState<boolean>(true)
  const [appWidth, setAppWidth] = useState<number>(312)
  const [appHeight, setAppHeight] = useState<number>(185)

  const [topicRequest, setTopicRequest] = useState<TopicRequest | undefined>()
  const [wikiVisible, showWiki] = useState<boolean>(false)
  const [wikiPosition, setWikiPosition] = useState<string | undefined>('interval')

  const subjectVisualRef = useRef<HTMLDivElement>(null)

  const logErrorState = (errorMsg: string, error: Error) => {
    consoleLog({ prefix: 'Error', message: errorMsg + '\nDetail: ', object: error })
    setErrorMsg(errorMsg)
    setError(error)
  }

  //
  // Fetch all the hints from the backend service
  // This needs to be done once then retained in HintService
  //
  const initHints = () => {
    fetchService
      .hints()
      .then((res) => {
        if (!res.data || res.data.length === 0) {
          logErrorState('Failed to fetch hints', new Error('Response data payload was empty.'))
        } else {
          hintService.setHints(res.data)
        }
      })
      .catch((err) => {
        logErrorState('Failed to fetch hints data', err)
      })
  }

  //
  // Fetch all the categories from the backend service
  // This needs to be done once then retained and passed to the subject Swimlane component
  //
  const initCategories = () => {
    fetchService
      .subjectCategories()
      .then((res) => {
        if (!res.data || res.data.length === 0) {
          logErrorState('Failed to fetch categories be fetched', new Error('Response data payload was empty.'))
        } else {
          const filteredCategories: FilteredCategory[] = []
          for (const category of res.data.values()) {
            filteredCategories.push({
              name: category,
              filtered: false,
            })
          }
          setFilteredCategories(filteredCategories)
        }
      })
      .catch((err) => {
        logErrorState('Failed to fetch interval data', err)
      })
  }

  const handleSubjectSelection = useCallback((subject: Subject) => {
    if (subject) {
      setTopicRequest({type: TopicType.subject, topicTarget: subject})
      showHelp(false)
    }

    setSubject(subject)
  }, [subject])

  useEffect(() => {
    if (!initialised) {
      initialised = true
      initHints()
      initCategories()
    }
  }, [])

  if (!initialised) {
    return (
      <div className='app-loading'>
        <Loading />
      </div>
    )
  }

  const handleIntervalSelection = (newInterval: Interval) => {

    if (interval === newInterval)
      return

    if (newInterval) {
      setTopicRequest({type: TopicType.interval, topicTarget: newInterval})
      showHelp(false)
    }

    setInterval(newInterval)
  }

  //
  // changedCategories is array of {name: ..., filtered: true|false}
  //
  const updateCategoryFilter = (changedCategories: FilteredCategory[]) => {
    if (!changedCategories || changedCategories.length === 0) {
      return
    }

    const copyCategories = [...filteredCategories]

    changedCategories.forEach((changedCategory: FilteredCategory) => {
      const idx = filteredCategories.findIndex((category) => {
        return category.name === changedCategory.name
      })

      if (idx === -1) {
        return
      }

      const copyCat = {
        ...copyCategories[idx],
        filtered: changedCategory.filtered,
      }

      copyCategories[idx] = copyCat
    })

    setFilteredCategories(copyCategories)
  }

  /*
   * Used by the mobile version to open the wiki
   *
   * type: determines which button was clicked to open the wiki (interval or subject)
   */
  const handleWikiClick = (event: any, type: string) => {
    toggleWiki(event, type)
    event.stopPropagation()
  }

  /*
   * Used when display in mobile and the wiki is a dialog
   * displayed using the wiki button
   */
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  const toggleWiki = (event: any, type: string | undefined) => {
    if (!type) {
      type = wikiPosition
    }

    showWiki(!wikiVisible)
    setWikiPosition(type)
  }

  const toggleHelp = () => {
    showHelp(!help)
  }


  const subjectViz = (
      <SubjectVisual
        parent = { subjectVisualRef }
      //  onSelectedSubject={handleSubjectSelection}
      //   onUpdateCategoryFilter={this.updateCategoryFilter}
      />
  )

  const helpPage = <HelpPage onToggleHelp={toggleHelp} />

  const subjectHelpVisual = help ? helpPage : subjectViz

  return (
    <div className='app grid-container'>
      <AppContext.Provider
        value={{
          appWidth,
          appHeight,
          interval,
          setInterval: handleIntervalSelection,
          subject,
          setSubject: handleSubjectSelection,
          filteredCategories,
          setFilteredCategories
        }}
      >
        <nav className='header navbar navbar-expand-lg'>
          <div className='container-fluid'>
            <p className='header-title'>EvoTempus</p>
            <p className='header-title collapse navbar-collapse'>Dashboard of Earth History</p>
            <button
              id='collapsible'
              className='navbar-toggler fas fa-bars'
              type='button'
              data-bs-toggle='collapse'
              data-bs-target='#navbarSupportedContent'
              aria-controls='navbarSupportedContent'
              aria-expanded='false'
              aria-label='Toggle navigation'
            ></button>
            <div className='collapse navbar-collapse' id='navbarSupportedContent'>
              <Search />
            </div>
          </div>
        </nav>

        <div className='interval-visual-group'>
          <div className='interval-visual-help'>
            <button id='interval-visual-help-btn' className='fas fa-question-circle' onClick={() => toggleHelp()} />
          </div>
          <div id='interval-visual' className='interval-visual'>
            <IntervalVisual />
            <div
              id='interval-wiki-card-btn-container'
              className={topicRequest && isInterval(topicRequest.topicTarget) ? 'show' : 'hide'}
            >
              <button id='interval-wiki-card-btn' onClick={(event) => handleWikiClick(event, 'interval')}>
                <img src={wikiLogoV2} alt='W' />
              </button>
            </div>
          </div>
        </div>

        <div className='subject-visual' ref={subjectVisualRef}>
          {subjectHelpVisual}
          <div id='subject-wiki-card-btn-container'
            className={topicRequest && isSubject(topicRequest.topicTarget) ? 'show' : 'hide'}>
            <button id='subject-wiki-card-btn' onClick={(event) => handleWikiClick(event, 'subject')}>
              <img src={wikiLogoV2} alt='W' />
            </button>
          </div>
        </div>

        <div id="wiki-card" className={`${wikiVisible ? 'show' : 'hide'} ${wikiPosition}`}>
          <Wiki
            topicRequest={topicRequest}
            toggleWiki={toggleWiki}
          />
        </div>
      </AppContext.Provider>

      <footer className='footer'>
        <p id='app-footer-copyright'>
          &copy; P. G. Richardson {present(2030)} - Licensed under{' '}
          <a href='https://www.gnu.org/licenses/gpl-3.0.en.html'>GPL 3.0 or later</a>
        </p>
        <a
          id='app-footer-logo'
          href='https://en.wikipedia.org/wiki/Geologic_time_scale'
          target='_blank'
          rel='noopener noreferrer'
        >
          <img src={geoclock} alt='geo-clock' />
        </a>
      </footer>
    </div>
  )
}
