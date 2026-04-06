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
import { Loading } from 'src/layout'
import { ErrorMsg } from '../ErrorMsg'

type MainProps = {
  loading: boolean
  error: Error | undefined
  errorMsg: string
  description: string
}

export const Main: React.FunctionComponent<MainProps> = (props: MainProps) => {

  const wikiDescription = (): React.ReactNode => {
    if (props.loading) return (<></>)

    if (props.error) return ( <ErrorMsg error={props.error as Error} errorMsg={props.errorMsg}/> )

    return ( <p>{props.description}</p> )
  }

  const wikiText = (): React.ReactNode => {
    return (
      <div id="wiki-text" className={props.loading ? 'disappear' : 'fade-in'}>
        {wikiDescription()}
      </div>
    )
  }

  return (
    <React.Fragment>
      <div id="wiki-main">
        <div id="wiki-main-inner">

          {props.loading && (
            <div id="wiki-loading" className="fade-in">
              <Loading/>
            </div>
          )}
          {!props.loading && (
            <div id="wiki-loading" className="disappear"/>
          )}

          {wikiText()}
        </div>
      </div>
    </React.Fragment>
  )
}
