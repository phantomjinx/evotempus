import React from 'react'

type HeaderCloseButtonProps = {
  toggleWiki: (event: any, type?: string) => void
}

export const HeaderCloseButton: React.FunctionComponent<HeaderCloseButtonProps> = (props: HeaderCloseButtonProps) => {

  return (
    <React.Fragment>
      <button
        id="wiki-closebtn" className="fa-regular fa-circle-xmark"
        onClick={props.toggleWiki}>
      </button>
    </React.Fragment>
  )
}
