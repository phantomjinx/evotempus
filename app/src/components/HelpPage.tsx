import React from 'react'
import './HelpPage.scss'

interface HelpPageProps {
  onToggleHelp: (toggle: boolean) => void
}

export const HelpPage: React.FunctionComponent<HelpPageProps> = (props: HelpPageProps) => {
  return (
    <div className='help-page'>
      <div id='help-page-content' className='help-page-content'>
        <button className='help-page-closebtn fas fa-times' onClick={() => props.onToggleHelp(false)}></button>

        <div className='help-page-cards'>
          <div className='card'>
            <div id='headingIntro' className='card-header'>
              <h5 className='help-page-title-text'>
                <button
                  className='btn'
                  data-bs-toggle='collapse'
                  data-bs-target='#collapseIntro'
                  aria-expanded='true'
                  aria-controls='collapseIntro'
                >
                  Introduction
                </button>
              </h5>
            </div>
            <div
              id='collapseIntro'
              className='collapse show'
              aria-labelledby='headingIntro'
              data-parent='#help-page-content'
            >
              <div className='card-body'>
                <h5 className='card-title'>Welcome to EvoTempus.</h5>
                <p className='card-text'>
                  An index of the evolution of Planet Earth, from its birth 4.5 billion years. Its easy to get confused
                  over dates and names of ages so this attempts to provide context using the time scale of the planetary
                  geological intervals. Ever wondered how the Stone Age (Paleolithic) relates to the Cenozoic? Hopefully
                  this should help.
                </p>
              </div>
            </div>
          </div>

          <div className='card'>
            <div id='headerUsage' className='card-header'>
              <h5 className='help-page-title-text'>
                <button
                  className='btn'
                  data-bs-toggle='collapse'
                  data-bs-target='#collapseUsage'
                  aria-expanded='true'
                  aria-controls='collapseUsage'
                >
                  Usage
                </button>
              </h5>
            </div>
            <div id='collapseUsage' className='collapse' aria-labelledby='headerUsage' data-parent='#help-page-content'>
              <div className='card-body'>
                <p className='card-text'>
                  The circular visual illustrates Earth's geological intervals, as classified by the&nbsp;
                  <a href='https://stratigraphy.org' target='_blank' rel='noopener noreferrer'>
                    International Commission on Stratigraphy
                  </a>
                  . Starting at the top, moving clockwise, it displays the chronological sequence of ages from oldest to
                  youngest. Those intervals nearest the centre are parents of the intervals further out, eg. the
                  PreCambrian encapsulates the Hadean, Archaen and Proterozoic.
                </p>
                <p className='card-text'>
                  Zooming and panning are available using the default methods of the display device, eg. pinching on a
                  tablet.
                </p>
                <p className='card-text'>
                  <em>Double-Clicking</em> an interval will expand it, making it the central parent of the other child
                  intervals displayed. Only those intervals with child-intervals can be expanded, eg. the Archaen can be
                  navigated into while the Hadean cannot.
                </p>
                <p className='card-text'>
                  A <em>Double-Click</em> on the central parent will collapse it to its own parent.
                </p>
                <p className='card-text'>
                  A <em>Single-Click</em> on an interval selects it, leading to:
                </p>
                <ul className='list-group list-group-flush'>
                  <li className='list-group-item'>
                    A timeline visualization of subjects (Events, Geological, Faunal and Floral) being displayed. All
                    the subjects occurred within the limits of the geological interval, although some may begin in prior
                    intervals and/or end in subsequent intervals.
                  </li>
                  <li className='list-group-item'>
                    A pane is displayed providing an explanation of the interval selected. On smaller screens, a buttton
                    is provided instead, which when pressed with display the pane as a slide-in window. The content is a
                    brief summary description of the interval, according to{' '}
                    <a href='https://www.wikipedia.org'>Wikipedia</a>. The whole Wikipedia article can be accessed using
                    the button at the bottom-right of the pane.
                  </li>
                </ul>
                <p className='card-text'>
                  A <em>Single-Click</em> on any subject in the timeline visualization, selects it and displays a
                  description in the same way as clicking an interval.
                </p>
                <p className='card-text'>
                  A <em>Double-Click</em> on any subject in the timeline visualization will attempt to present it in the
                  most accurate geological interval according to the subject's date range. If the subject happens to
                  cross boundaries then this can result in the geological interval being the base &quot;Geological
                  Timescale&quot;.
                </p>
                <p className='card-text'>
                  Click the menu button on the timeline visual to display the labels of the subjects&apos; category.
                  Subjects belonging to these categories can be filtered out of the timeline visual by clicking each of
                  these labels. The subjects can be restored with a second click. This filtering is maintained while
                  clicking on subjects or on geolical intervals.
                </p>
                <p className='card-text'>
                  A Search box is available for finding any intervals, subjects or descriptions by keyword. A slide-in
                  pane will display the search results and a<em>Single-Click</em> will navigate to the target in the
                  visuals.
                </p>
              </div>
            </div>
          </div>

          <div className='card'>
            <div id='headerAck' className='card-header'>
              <h5 className='help-page-title-text'>
                <button
                  className='btn'
                  data-bs-toggle='collapse'
                  data-bs-target='#collapseAck'
                  aria-expanded='true'
                  aria-controls='collapseAck'
                >
                  Acknowledgement
                </button>
              </h5>
            </div>
            <div id='collapseAck' className='collapse' aria-labelledby='headerAck' data-parent='#help-page-content'>
              <div className='card-body'>
                <p className='card-text'>
                  The data was downloaded from the <a href='https://paleobiodb.org'>Paleobiology Database</a> on 8th
                  July, 2021 using the following parameters:
                </p>
                <ul className='list-group list-group-flush help-page-smaller-italic'>
                  <li className='list-group-item'>taxon_reso: genus</li>
                  <li className='list-group-item'>
                    interval: [NAMED GEOLOGICAL TIME PERIOD | xMa],[NAMED GEOLOGICAL TIME PERIOD | xMa]
                  </li>
                  <li className='list-group-item'>time_rule: overlap</li>
                  <li className='list-group-item'>show: class,taphonomy,paleoloc,geo</li>
                </ul>
                <p className='card-text'>
                  The data includes records from all collections spanning the GSA Geological Time Scale so impractical
                  to cite all the contributors individually so please extend my sincere thanks to all contributors.
                </p>
              </div>
            </div>
          </div>

          <div className='card'>
            <div id='headerContrib' className='card-header'>
              <h5 className='help-page-title-text'>
                <button
                  className='btn'
                  data-bs-toggle='collapse'
                  data-bs-target='#collapseContrib'
                  aria-expanded='true'
                  aria-controls='collapseContrib'
                >
                  Contributing
                </button>
              </h5>
            </div>
            <div
              id='collapseContrib'
              className='collapse'
              aria-labelledby='headerContrib'
              data-parent='#help-page-content'
            >
              <div className='card-body'>
                <p className='card-text'>
                  The source code and data for this project is available on{' '}
                  <a href='https://github.com/phantomjinx/evotempus'>github</a> and licensed under the{' '}
                  <a href='https://github.com/phantomjinx/evotempus/blob/master/LICENSE'>GPLv3</a>.
                </p>
                <p className='card-text'>
                  Additional licences for components used in this work are available from the project{' '}
                  <a href='https://github.com/phantomjinx/evotempus/tree/master/Licences'>here</a>.
                </p>
                <p className='card-text'>
                  If you find a bug or would like to add some data points then please do not hesitate to file an issue
                  or post a pull-request.
                </p>
                <p className='card-text'>Thanks.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
