import React from 'react';
import './Loading.scss';

class Loading extends React.Component {

  render() {
    return (
      <div className="loading">
        <div className="spinner infinity" id="infinity">
          <div className="half">
            <div className="marker"></div>
            <div className="marker"></div>
            <div className="marker"></div>
            <div className="marker"></div>
            <div className="marker"></div>
            <div className="marker"></div>
          </div>
          <div className="half">
            <div className="marker"></div>
            <div className="marker"></div>
            <div className="marker"></div>
            <div className="marker"></div>
            <div className="marker"></div>
            <div className="marker"></div>
          </div>
        </div>
      </div>
    );
  }
}

export default Loading;
