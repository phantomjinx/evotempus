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

import React, { useCallback, useMemo, useRef } from 'react'
import { useEffect, useState } from 'react'

import './App.scss'
import { AppContext } from '@evotempus/core/context'
import { hintService } from '@evotempus/api'
import { ErrorMsg, Loading } from '@evotempus/components'
import { FilteredCategory, Interval, Subject, TopicRequest, TopicType } from '@evotempus/types'
import { HelpPage, IntervalVisual, Search, SubjectVisual, Wiki } from '@evotempus/features'
import { present, isSubject, isInterval, logError } from '@evotempus/utils'
import wikiLogoV2 from '@evotempus/assets/images/wikipedia-logo-v2.svg'
import geoclock from '@evotempus/assets/images/geologic-clock.png'
import { useCategoriesQuery, useHintsQuery } from '@evotempus/hooks'

export const App: React.FunctionComponent = () => {
  //
  // Fetch all the hints from the backend service
  // This needs to be done once then retained in HintService
  //
  const { data: hints, isLoading: hintsLoading, error: hintsError } = useHintsQuery()
  //
  // Fetch all the categories from the backend service
  // This needs to be done once then retained and passed to the subject Swimlane component
  //
  const { data: categories, isLoading: categoriesLoading, error: categoriesError } = useCategoriesQuery()
  const [hiddenCategories, setHiddenCategories] = useState<Set<string>>(new Set())

  const [interval, setInterval] = useState<Interval | undefined>(undefined)
  const [subject, setSubject] = useState<Subject | undefined>(undefined)

  const [help, showHelp] = useState<boolean>(true)

  const [topicRequest, setTopicRequest] = useState<TopicRequest | undefined>()
  const [wikiVisible, showWiki] = useState<boolean>(false)
  const [wikiPosition, setWikiPosition] = useState<string | undefined>('interval')

  const subjectVisualRef = useRef<HTMLDivElement>(null)

  const logAppError = (errorMsg: string, error?: Error) => {
    logError({ prefix: 'App', message: errorMsg + '\nDetail: ', object: error })
  }

  const handleSubjectSelection = (subject: Subject) => {
    if (subject) {
      setTopicRequest({type: TopicType.subject, topicTarget: subject})
      showHelp(false)
    }

    setSubject(subject)
  }

  // Initialize HintService when hints data is available
  useEffect(() => {
    if (hints?.data && hints.data.length > 0) {
      hintService.setHints(hints.data)
    }
  }, [hints])

  // Build filteredCategories from categories data and modify
  // when the hidden categories set is updated
  const filteredCategories = useMemo(() => {
    if (!categories?.data) return []

    return Array.from(categories.data.values()).map(category => ({
      name: category,
      filtered: hiddenCategories.has(category) // True if the user hid it, false otherwise
    }))
  }, [categories, hiddenCategories])

  // Setter for updating the hidden categories
  const toggleCategoryFilter = useCallback((changedCategories: FilteredCategory[]) => {
    setHiddenCategories(prev => {
      const next = new Set(prev)
      for (let i = 0; i < changedCategories.length; ++i) {
        const cc = changedCategories[i]

        if (cc.filtered) {
          next.add(cc.name)    // clicked to hide it
        } else {
          next.delete(cc.name) // clicked to show it
        }
      }

      return next
    })
  }, [])

  // Reset the hidden categories
  const resetCategoryFilters = useCallback(() => {
    setHiddenCategories(new Set())
  }, [])

  const handleIntervalSelection = (newInterval: Interval) => {

    if (interval === newInterval)
      return

    if (newInterval) {
      setTopicRequest({type: TopicType.interval, topicTarget: newInterval})
      showHelp(false)
    }

    setInterval(newInterval)
  }

  /*
   * Used by the mobile version to open the wiki
   *
   * type: determines which button was clicked to open the wiki (interval or subject)
   */
  const handleWikiClick = (event: React.MouseEvent<HTMLButtonElement>, type?: string) => {
    toggleWiki(type)
    event.stopPropagation()
  }

  /*
   * Used when display in mobile and the wiki is a dialog
   * displayed using the wiki button
   */
  const toggleWiki = (type: string|undefined) => {
    if (!type) {
      type = wikiPosition
    }

    showWiki(!wikiVisible)
    setWikiPosition(type)
  }

  const toggleHelp = () => {
    showHelp(!help)
  }

  if (hintsLoading || categoriesLoading) {
    return (
      <div className='app-loading'>
        <Loading />
      </div>
    )
  }

  const subjectViz = (
    <SubjectVisual parent = { subjectVisualRef } />
  )

  const helpPage = <HelpPage onToggleHelp={toggleHelp} />

  const subjectHelpVisual = help ? helpPage : subjectViz

  if (hintsError || categoriesError) {
    const errorMsg = hintsError?.message || categoriesError?.message || 'Failed to load data'
    const combinedError = hintsError || categoriesError
    logAppError(errorMsg, combinedError || undefined)
    return <ErrorMsg error={combinedError || undefined} errorMsg={errorMsg} />
  }

  return (
    <div className='app grid-container'>
      <AppContext.Provider
        value={{
          interval,
          setInterval: handleIntervalSelection,
          subject,
          setSubject: handleSubjectSelection,
          filteredCategories,
          toggleCategoryFilter,
          resetCategoryFilters
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
