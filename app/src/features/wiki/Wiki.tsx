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

import React, { useEffect, useState } from 'react'
import { useTopicDescriptionQuery } from '@evotempus/hooks'
import { TopicRequest } from '@evotempus/types'
import { logError, normalizeError } from '@evotempus/utils'
import './Wiki.scss'
import { Header } from './Header'
import { Footer } from './Footer'
import { Main } from './Main'

type WikiProps = {
  topicRequest: TopicRequest | undefined
  toggleWiki: (type?: string) => void
}

export const Wiki: React.FunctionComponent<WikiProps> = (props: WikiProps) => {

  if (!props.topicRequest) {
    return <></>
  }

  // Declarative fetch based on the props
  const { data, isPending, isError, error } = useTopicDescriptionQuery(
    props.topicRequest.type,
    props.topicRequest.topicTarget._id
  )

  // Derive our UI variables directly from TanStack state
  const loading = isPending
  const linkId = data?.linkId || 'Geologic_time_scale'
  const description = data?.description || ''

  // Custom error logic derivation
  let currentError: Error | undefined = undefined
  let currentErrorMsg = ''

  if (isError) {
    currentError = normalizeError(error)
    currentErrorMsg = 'Failed to fetch description'
    logError({ prefix: 'Wiki', message: `Error: ${currentErrorMsg}`, object: currentError })
  } else if (data && !data.description) {
    currentError = new Error('No description could be loaded.')
    currentErrorMsg = 'Description cannot be displayed'
    logError({ prefix: 'Wiki', message: `Error: ${currentErrorMsg}`, object: currentError })
  }

  return (
    <div id="wiki-container">
      <Header topicTarget={props.topicRequest.topicTarget} toggleWiki={props.toggleWiki}/>
      <Main loading={loading} error={currentError} errorMsg={currentErrorMsg} description={description} />
      <Footer linkId={linkId}/>
    </div>
  )
}
