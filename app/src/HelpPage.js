import React from 'react';
import './HelpPage.scss';

export default class HelpPage extends React.Component {

  render() {
    return (
      <div className="help-page">
        <div className="help-page-content">
          <div className="help-page-title">
            <h5 className="help-page-title-text help-page-bold">Introduction</h5>
            <button
              className="help-page-closebtn fa fa-times"
              onClick={() => this.props.onToggleHelp(false)}>
            </button>
          </div>
          <p>Welcome to EvoTempus.</p>
          <p>
            An index of the evolution of Planet Earth, from its birth 4.5 billion years. Its easy to get confused over
            dates and names of ages so this attempts to provide context using the time scale of the planetary geological
            intervals. Ever wondered how the Stone Age (Paleolithic) relates to the Cenozoic? Hopefully this should help.
          </p>
          <h5 className="help-page-bold">Usage</h5>
          <p>
            The circular visualization illustrates Earth's geological intervals, as classified by
            the <a href="https://stratigraphy.org" target="_blank" rel="noopener noreferrer">International Commission on Stratigraphy</a>.
            Starting at the top, moving clockwise, it displays the chronological sequence of ages from oldest to youngest.
            Those intervals nearest the centre are parents of the intervals further out, eg. the PreCambrian encapsulates the
            Hadean, Archaen and Proterozoic.
          </p>
          <p>
            Should the visualization be a too small then zooming and panning are available using the default methods of the device.
          </p>
          <p>
            <em>Double-Clicking</em> an interval will expand it, making it the central parent of the other child intervals displayed.
            Only those intervals with child-intervals can be expanded, eg. the Archaen can be navigated into while the Hadean cannot.
          </p>
          <p>
            A <em>Double-Click</em> on the central parent will collapse it to its own parent.
          </p>
          <p>
            A <em>Single-Click</em> on an interval selects it, leading to:
          </p>
          <ul>
            <li>
              A timeline visualization of subjects (Events, Geological, Faunal and Floral) being displayed. All the subjects occurred within
              the limits of the geological interval, although some may begin in prior intervals and/or end in subsequent intervals.
            </li>
            <li>
              A pane is displayed providing an explanation of the interval selected. On smaller screens, a buttton is provided
              instead, which when pressed with display the pane as a slide-in window. The content is a brief summary description of
              the interval, according to <a href="https://www.wikipedia.org">Wikipedia</a>. The whole Wikipedia article can be accessed
              using the button at the bottom-right of the pane.
            </li>
          </ul>
          <p>
            A <em>Single-Click</em> on any subject in the timeline visualization, selects it and displays a description in the same way as clicking
            an interval.
          </p>
          <p>
            A <em>Double-Click</em> on any subject in the timeline visualization will attempt to present it in the most accurate geological interval
            according to the subject's date range. If the subject happens to cross boundaries then this can result in the geological interval being
            the base &quot;Geological Timescale&quot;.
          </p>
          <p>
            Click the menu button on the timeline visualization to display the labels of the subjects&apos; category. Subjects belonging to these
            categories can be filtered out of the timeline visualization by clicking each of these labels. The subjects can be restored with a
            second click. This filtering is maintained while clicking on subjects or on geolical intervals. 
          </p>
          <p>
            A Search box is available for finding any intervals, subjects or descriptions by keyword. A slide-in pane will display the search
            results and a <em>Single-Click</em>  will navigate to the target in the visualizations.
          </p>
        </div>
      </div>
    )
  }

}
