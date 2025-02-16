import React, { useContext, useState } from 'react'
import Pagination from 'react-pagination-js'
import { fetchService } from '@evotempus/api'
import { AppContext, ErrorMsg, Tabs } from '@evotempus/components'
import { Interval, Subject, Topic, Results, TopicType } from '@evotempus/types'
import { isTopic, getListIcon, idToTitle, isInterval, isSubject } from '@evotempus/utils'
import './Search.scss'
import 'react-pagination-js/dist/styles.css' // import css

export const Search: React.FunctionComponent = () => {
  const { setInterval, setSubject } = useContext(AppContext)
  const [searchTerm, setSearchTerm] = useState<string>('')
  const [msg, setMessage] = useState<string>('')
  const [msgClass, setMessageClass] = useState<string>('')
  const [error, setError] = useState<Error | undefined>(undefined)
  const [intervalPage, setIntervalPage] = useState<number>(1)
  const [subjectPage, setSubjectPage] = useState<number>(1)
  const [topicPage, setTopicPage] = useState<number>(1)
  const [results, setResults] = useState<Results>({
    intervals: [],
    subjects: [],
    topics: [],
  })
  const [resultsClass, setResultsClass] = useState<string>('search-results-hide')

  const totalPerPage = 10

  const pageFn = {
    interval: (newPage: number) => {
      setIntervalPage(newPage)
    },
    subject: (newPage: number) => {
      setSubjectPage(newPage)
    },
    topic: (newPage: number) => {
      setTopicPage(newPage)
    },
  }

  const handleSearch = (event: React.SyntheticEvent) => {
    if (!searchTerm) {
      setError(undefined)
      return
    }

    setResultsClass('search-results-waiting')
    setError(undefined)

    //
    // Search the backend service
    //
    fetchService
      .search(searchTerm)
      .then((res) => {
        if (!res.data) {
          setMessage('No results found')
          setResultsClass('search-results-show')
        } else {
          setMessage(resultsMsg(res.data.intervals, res.data.subjects, res.data.topics))
          setMessageClass('search-msg-info')
          setIntervalPage(1)
          setSubjectPage(1)
          setTopicPage(1)
          setResults({
            intervals: res.data.intervals,
            subjects: res.data.subjects,
            topics: res.data.topics,
          })
          setResultsClass('search-results-show')
        }
      })
      .catch((err) => {
        setMessage('An error occurred whilst searching')
        setMessageClass('search-msg-error')
        setError(err)
        setResultsClass('search-results-show')
      })

    event.preventDefault()
  }

  const resultsMsg = (intervals: Interval[], subjects: Subject[], topics: Topic[]): string => {
    const total = (intervals ? intervals.length : 0) + (subjects ? subjects.length : 0) + (topics ? topics.length : 0)
    return 'Found ' + total + ' results'
  }

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value)
  }

  const closeSearchResults = () => {
    setResultsClass('search-results-hide')
  }

  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  const handleNavigate = (target: Interval | Subject | Topic, event?: React.SyntheticEvent) => {
    if (event) {
      event.preventDefault()
    }

    closeSearchResults()
    setMessage(resultsMsg(results.intervals, results.subjects, results.topics))

    if (isInterval(target)) {
      setInterval(target as Interval)
    } else if (isSubject(target)) {
      const subject: Subject = target as Subject
      fetchService
        .intervalEncloses(subject.from, subject.to)
        .then((res) => {
          if (!res.data || res.data.length === 0) {
            setMessage('Error: Cannot navigate to a parent interval of the subject')
          } else {
            //
            // Selected the returned interval
            //
            setInterval(res.data[0])
            setSubject(subject)
          }
        })
        .catch((err) => {
          setMessage('An error occurred whilst trying to navigate to subject')
          setMessageClass('search-msg-error')
          setError(err)
        })
    } else if (isTopic(target)) {
      const topic: Topic = target as Topic
      if (topic.topicTarget === TopicType.subject) {
        fetchService
          .subjectById(topic.topic)
          .then((res) => {
            if (!res.data) {
              setMessage('Error: Cannot navigate to a parent subject of the description')
            } else {
              //
              // Navigate to the returned interval
              //
              const subject = res.data
              subject.fieldType = 'subject'
              handleNavigate(subject)
            }
          })
          .catch((err) => {
            setMessage('An error occurred whilst trying to navigate to description')
            setMessageClass('search-msg-info')
            setError(err)
          })
      } else if (topic.topicTarget === TopicType.interval) {
        fetchService
          .intervalById(topic.topic)
          .then((res) => {
            if (!res.data) {
              setMessage('Error: Cannot navigate to a parent interval of the description')
            } else {
              //
              // Navigate to the returned interval
              //
              const interval = res.data
              interval.fieldType = 'interval'
              handleNavigate(interval)
            }
          })
          .catch((err) => {
            setMessage('An error occurred whilst trying to navigate to description')
            setMessageClass('search-msg-error')
            setError(err)
          })
      } else {
        setMessage('Cannot navigate to unknown result')
        setMessageClass('search-msg-error')
      }
    }
  }

  const hasResults = () => {
    return results.intervals.length > 0 || results.subjects.length > 0 || results.topics.length > 0
  }

  const resultBlock = (
    title: string,
    currentPage: number,
    changePageFn: (newPage: number) => void,
    results: Interval[] | Subject[] | Topic[],
  ) => {
    const myClass = 'search-results-content-' + title.toLowerCase()
    let items = []

    if (results.length === 0) {
      items.push(
        <li key='no-results-1' style={{ listStyle: 'none', listStyleImage: 'none', fontWeight: 'bold' }}>
          <p className='search-results-content-none-found'>No results found for this category.</p>
        </li>,
      )
    } else {
      for (const value of results.values()) {
        const styleImage: string = 'url(' + getListIcon(value) + ')'
        const label = isTopic(value) ? (value as Topic).topic : (value as Interval | Subject).name
        items.push(
          <li key={value._id} style={{ listStyleImage: styleImage }}>
            <button className='link-button' onClick={handleNavigate.bind(this, value)}>
              {idToTitle(label)}
            </button>
          </li>,
        )
      }
    }

    let paginate: JSX.Element = <></>
    if (items.length > totalPerPage) {
      const offset = (currentPage - 1) * totalPerPage
      items = items.slice(offset, offset + totalPerPage)
      paginate = (
        <Pagination
          currentPage={currentPage}
          totalSize={results.length}
          sizePerPage={totalPerPage}
          changeCurrentPage={changePageFn}
          theme='border-bottom'
        />
      )
    }

    return (
      // Ignore the entryCount attribute not being a recognised property of <div>
      // @ts-ignore
      <div title={title} entryCount={results.length} className={myClass}>
        {paginate}
        <ul className='search-results-content-items'>{items}</ul>
      </div>
    )
  }

  const searchBox = (
    <div className='search-box'>
      <form className='search-form form-inline' onSubmit={handleSearch}>
        <input
          className='form-control search-term'
          type='search'
          placeholder='Search'
          aria-label='Search'
          value={searchTerm}
          onChange={handleChange}
        />
        <button className='fas fa-search search-button' type='submit' />
      </form>
    </div>
  )

  const closeButton = (
    <div>
      <button className='search-results-closebtn fas fa-times' onClick={closeSearchResults}></button>
    </div>
  )

  if (error) {
    return (
      <div className='evo-search'>
        {searchBox}
        <div className={'search-results ' + resultsClass}>
          <div className='search-results-inner'>
            {closeButton}
            <div className='search-results-content'>
              <ErrorMsg error={error} errorMsg={msg} />
            </div>
          </div>
        </div>
      </div>
    )
  }

  let resultsTabs: JSX.Element = <></>
  //
  // By checking the results class, this ensures that the tabs are unmounted
  // when the results window is closed thereby ensuring that the tabs.useEffects for
  // selecting the activeTab is fired the next time a search is triggered.
  // Otherwise, running 1 search followed by another only triggers the activeTab select
  // after the first search but not the second. Making the useEffect more powerful by
  // using a props var or other value causes problems when selecting other tabs or the
  // content paging numbers.
  //
  if (hasResults() && resultsClass === 'search-results-show') {
    resultsTabs = (
      <Tabs>
        {resultBlock(
          'Geological Intervals (' + results.intervals.length + ')',
          intervalPage,
          pageFn.interval,
          results.intervals,
        )}
        {resultBlock(
          'Historical Subjects (' + results.subjects.length + ')',
          subjectPage,
          pageFn.subject,
          results.subjects,
        )}
        {resultBlock('Descriptions (' + results.topics.length + ')', topicPage, pageFn.topic, results.topics)}
      </Tabs>
    )
  }

  return (
    <div className='evo-search'>
      {searchBox}
      <div className={'search-results ' + resultsClass}>
        <div className='search-results-inner'>
          {closeButton}
          <div className='search-results-content'>
            <p className={msgClass}>{msg}</p>
            {resultsTabs}
          </div>
        </div>
      </div>
    </div>
  )
}
