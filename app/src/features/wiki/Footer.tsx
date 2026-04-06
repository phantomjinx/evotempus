import React from 'react'
import * as common from '@evotempus/utils'
import wikiLogo from '@evotempus/assets/images/wikipedia-logo-with-label.svg'

type FooterProps = {
  linkId: string
}

export const Footer: React.FunctionComponent<FooterProps> = (props: FooterProps) => {

  return (
    <div id="wiki-footer">
      <a id="wiki-footer-logo" href={common.wikiLink + props.linkId}
         target="_blank" rel="noopener noreferrer">
        <img src={wikiLogo} alt="Wikipedia"/>
      </a>
      <p id="link-instruction-arrow">&rarr;</p>
      <p id="link-instruction-text">To read further, click here</p>

      <p id="unit-defn" className="fade-in">
        <span>
          <a href={common.wikiLink + "Year#SI_prefix_multipliers"} target="_blank" rel="noopener noreferrer">
            Ma: 1 million years
          </a>
        </span>
        <span>
          <a href={common.wikiLink + "Year#SI_prefix_multipliers"} target="_blank" rel="noopener noreferrer">
            ka: 1 thousand years
          </a>
        </span>
      </p>
    </div>
  )
}
