import React from 'react';
import './HelpPage.scss';

export default class HelpPage extends React.Component {

  render() {
    return (
      <div className="help-page">
        <button
          className="help-page-closebtn fa fa-times"
          onClick={() => this.props.onToggleHelp(false)}>
        </button>
        <div className="help-page-content">
          <h3>Introduction</h3>
          <p>Welcome to EvoTempus!</p>
          <p>
            A tool for indexing the evolution of Planet Earth, from its birth 4.5 billion years. Its easy to get confused over
            dates and names of ages so this tool associates them by providing timelines within the context of the planetary geological
            intervals. If you've ever wondered how the Stone Age (Paleolithic) relates to the Cenozoic then this should help.
          </p>
          <h3>Usage</h3>
          <p>
            The visualization on the left illustrates Earth's geological intervals. Starting at the top, in a clockwise fashion,
            it displays the chronological sequence from oldest to youngest. The sequence nearest the centre contains the parent
            intervals of those farther out, eg. the PreCambrian encapsulates the Hadean, Archaen and Proterozoic.
          </p>
          <p>
            <em>Double-clicking</em> an interval will zoom in and make it the central root of all other intervals displayed. Only
            intervals with sub-intervals can be zoomed into, eg. the Archaen can be zoomed into while the Hadean cannot.
            A <em>double-click</em> on the central sphere will zoom out again.
          </p>
          <p>
            A <em>single-click</em> on an interval selects it, leading to:
          </p>
          <ul>
            <li>
              A timeline detailing subjects (Events, Geological, Faunal and Floral) is displayed. All the subjects occurred within
              the limits of the geological interval, although some may begin in prior intervals and/or end in subsequent intervals.
            </li>
            <li>
              A pane is displayed beneath providing an explanation of the interval selected. The text is retrieved from the
              requisite page on <a href="https://www.wikipedia.org">Wikipedia</a> and its line is provided at the bottom-right
              corner of the pane.
            </li>
          </ul>
          <p>
            A single click on any subject in the timelines, selects it and likewise provides a description in the pane beneath.
          </p>
        </div>
      </div>
    )
  }

}
