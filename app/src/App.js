import React from 'react';
import 'font-awesome/css/font-awesome.min.css';
import './App.scss';
import Search from './Search.js';
import Wiki from './Wiki.js';
import IntervalVisual from './IntervalVisual.js';
import SubjectVisual from './SubjectVisual.js';
import HelpPage from './HelpPage.js';
import * as common from './common';

class App extends React.Component {

  constructor (props) {
    super(props);

    this.state = {
      help: true,
      interval: undefined,
      subject: undefined
    };

    this.subjectVisualRef = React.createRef();
    this.handleIntervalChange = this.handleIntervalChange.bind(this);
    this.handleSubjectChange = this.handleSubjectChange.bind(this);
    this.toggleHelp = this.toggleHelp.bind(this);
  }

  handleIntervalChange(interval) {
    //
    // Although makes sense to reset subject here, it creates a race condition
    // where the search navigation 'clicks' on the description then this refreshes
    // and cancels it.
    //
    this.setState({
      interval: interval,
      topicTarget: {
        type: 'interval',
        item: interval
      },
      help: false
    });
  }

  handleSubjectChange(subject) {
    this.setState({
      subject: subject,
      topicTarget: {
        type: 'subject',
        item: subject
      }
    });
  }

  toggleHelp(show) {
    this.setState({
      help: show
    });

  }

  render() {
    const subjectViz = (
      <SubjectVisual
        parent = { this.subjectVisualRef }
        interval={this.state.interval}
        subject={this.state.subject}
        onSelectedSubjectChange={this.handleSubjectChange}
      />
    )

    const showHelp = (
      <HelpPage
        onToggleHelp={this.toggleHelp}
      />
    )

    const subjectVisual = this.state.help ? showHelp : subjectViz;

    return (
      <div className="app grid-container">
        <header className="header">
          <h3 className="header-title">EvoTempus: Dashboard of Earth History</h3>
          <Search
            onSelectedIntervalChange={this.handleIntervalChange}
            onSelectedSubjectChange={this.handleSubjectChange}
          />
        </header>
        <main className="main">
          <div className="inner-main">
            <div className="main-visual">
              <div className="interval-visual">
                <div className="interval-visual-help">
                  <button id="interval-visual-help-btn" className="fa fa-question-circle" onClick={() => this.toggleHelp(true)}/>
                </div>
                <IntervalVisual
                  width="400" height="400"
                  interval={this.state.interval}
                  onSelectedIntervalChange={this.handleIntervalChange}
                />
              </div>
              <div className="subject-visual" ref={this.subjectVisualRef}>
                {subjectVisual}
              </div>
            </div>
            <div className="wiki-card">
              <Wiki
                topic={this.state.topicTarget}
              />
            </div>
          </div>
        </main>
        <footer className="footer">
          <p id="app-footer-copyright">
            &copy; P. G. Richardson {common.present(2030)} - Licensed under <a href="https://www.gnu.org/licenses/gpl-3.0.en.html">GPL 3.0 or later</a>
          </p>
          <a id="app-footer-logo" href="https://en.wikipedia.org/wiki/Geologic_time_scale"
            target="_blank" rel="noopener noreferrer">
            <img src="/geologic-clock.png" alt="geo-clock"/>
          </a>
        </footer>
      </div>
    );
  }
}

export default App;
