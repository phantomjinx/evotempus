import React from 'react'
import './ErrorMsg.scss'

interface ErrorProps {
  errorMsg?: string
  error?: Error
}

interface ErrorState {}

export const ErrorMsg: React.FunctionComponent<ErrorProps> = (props: ErrorProps) => {
  return (
    <div className='error-msg'>
      <h3>Error Occurred:</h3>
      <h4>{props.errorMsg}</h4>
      <details style={{ whiteSpace: 'pre-wrap' }} open={true}>
        {props.error && props.error.toString()}
      </details>
    </div>
  )
}
