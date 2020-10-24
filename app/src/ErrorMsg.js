import React from 'react';

class ErrorMsg extends React.Component {

  render() {
    return (
      <div>
        <h3>Error Occurred:</h3>
        <h4>{this.props.errorMsg}</h4>
        <details style={{ whiteSpace: 'pre-wrap' }}>
          {this.props.error && this.props.error.toString()}
        </details>
      </div>
    );
  }
}

export default ErrorMsg;
