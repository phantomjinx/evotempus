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
import { useEffect, useState } from 'react'
import { fetchService } from '@evotempus/api'
import { Topic, TopicRequest } from '@evotempus/types'
import { log, logError } from '@evotempus/utils'
import './Wiki.scss'
import { Header } from './Header'
import { Footer } from './Footer'
import { Main } from './Main'

type WikiProps = {
  topicRequest: TopicRequest | undefined
  toggleWiki: (event: any, type?: string) => void
}

export const Wiki: React.FunctionComponent<WikiProps> = (props: WikiProps) => {
  const [loading, setLoading] = useState<boolean>(true)
  const [linkId, setLinkId] = useState<string>('Geologic_time_scale')
  const [description, setDescription] = useState<string>('')
  const [error, setError] = useState<Error>()
  const [errorMsg, setErrorMsg] = useState<string>('')

  const logErrorState = (errorMsg: string, error: Error) => {
    logError({prefix: 'Wiki', message: "Error: " + errorMsg, object: error})
    setErrorMsg(errorMsg)
    setError(error)
    setLoading(false)
  }

  useEffect(() => {
    setLinkId('')
    setDescription('')
    setErrorMsg('')
    setError(undefined)
    setLoading(true)

    if (!props.topicRequest) {
      setLoading(false)
      return
    }

    fetchService.description(props.topicRequest.type, props.topicRequest.topicTarget._id)
      .then((res) => {
        if (!res.data || res.data.length === 0) {
          logErrorState("Description cannot be displayed", new Error("No description could be loaded."))
        } else {
          setLoading(false)
          setLinkId(res.data.linkId)
          setDescription(res.data.description)
        }
      })
      .catch((err) => {
        logErrorState("Failed to fetch description", err)
      })
  }, [props.topicRequest])

  if (! props.topicRequest) {
    return <></>
  }

  return (
    <div id="wiki-container">
      <Header topicTarget={props.topicRequest.topicTarget} toggleWiki={props.toggleWiki}/>
      <Main loading={loading} error={error} errorMsg={errorMsg} description={description} />
      <Footer linkId={linkId}/>
    </div>
  )
}
