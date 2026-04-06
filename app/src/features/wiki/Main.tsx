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
