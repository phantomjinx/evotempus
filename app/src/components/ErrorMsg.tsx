import React from 'react';
import './ErrorMsg.scss';

interface ErrorProps {
  errorMsg?: string,
  error?: Error
}

interface ErrorState {
}

class ErrorMsg extends React.Component<ErrorProps, ErrorState> {

  render() {
    return (
      <div className="error-msg">
        <h3>Error Occurred:</h3>
        <h4>{this.props.errorMsg}</h4>
        <details style={{ whiteSpace: 'pre-wrap'}} open={true}>
          {this.props.error && this.props.error.toString()}
        </details>
      </div>
    );
  }
}

export default ErrorMsg;
