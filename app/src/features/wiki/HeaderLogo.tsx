import React from 'react'
import geoclock from '@evotempus/assets/images/geologic-clock.png'

export const HeaderLogo: React.FunctionComponent = () => {

  return (
    <React.Fragment>
      <a id="wiki-header-logo" href="https://en.wikipedia.org/wiki/Geologic_time_scale"
        target="_blank" rel="noopener noreferrer">
        <img src={geoclock} alt="geo-clock"/>
      </a>
    </React.Fragment>
  )
}
