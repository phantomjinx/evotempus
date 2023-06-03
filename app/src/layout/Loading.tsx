import React from 'react'
import './Loading.scss'

export class Loading extends React.Component {
  render() {
    return (
      <div className='loading'>
        <div className='spinner sphere' id='sphere'>
          <div className='inner'>
            <div className='disc'></div>
            <div className='disc'></div>
            <div className='disc'></div>
          </div>
        </div>
      </div>
    )
  }
}

export default Loading
