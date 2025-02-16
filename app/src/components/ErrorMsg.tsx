import React from 'react'
import './ErrorMsg.scss'

interface ErrorProps {
  errorMsg?: string
  error?: Error
}

export const ErrorMsg: React.FunctionComponent<ErrorProps> = (props: ErrorProps) => {
  return (
    <div className='error-msg'>
      <h3>Error Occurred:</h3>
      <h4>{props.errorMsg}</h4>

      {
        props.error && (
          <details style={{ whiteSpace: 'pre-wrap' }} open={true}>
            {props.error.stack}
          </details>)
      }
    </div>
  )
}
