import React from 'react';
import './Loading.scss';

class Loading extends React.Component {

  render() {
    return (
      <div className="loading">
        <div class="spinner sphere" id="sphere">
          <div class="inner">
            <div class="disc"></div>
            <div class="disc"></div>
            <div class="disc"></div>
          </div>
        </div>
      </div>
    );
  }
}

export default Loading;
