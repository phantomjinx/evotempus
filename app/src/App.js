import React from 'react';
import 'font-awesome/css/font-awesome.min.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.bundle.min.js';

import './App.scss';
import Search from './Search.js';
import Wiki from './Wiki.js';
import IntervalVisual from './IntervalVisual.js';
import SubjectVisual from './SubjectVisual.js';
import HelpPage from './HelpPage.js';
import * as api from './api';
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

  logErrorState(errorMsg, error) {
    console.log("Error: " + errorMsg + "\n Detail: " + error);
    this.setState({
      errorMsg: errorMsg,
      error: error
    });
  }

  //
  // Fetch all the hints from the backend service
  // This needs to be done once then retained in common.js
  //
  fetchHints() {
    api.hints()
      .then((res) => {
        if (!res.data || res.data.length === 0) {
          this.logErrorState("Failed to fetch hints", new Error("Response data payload was empty."));
        } else {
          common.setHints(res.data);
        }
      }).catch((err) => {
        this.logErrorState("Failed to fetch hints data", err);
      });
  }

  componentDidMount() {
    this.fetchHints();
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
        <nav className="header navbar navbar-expand-lg">
          <a className="header-title" href="#">EvoTempus</a>
          <a className="header-title collapse navbar-collapse" href="#">Dashboard of Earth History</a>
          <button id="collapsible" className="navbar-toggler fa fa-bars" type="button" data-toggle="collapse"
                  data-target="#navbarSupportedContent" aria-controls="navbarSupportedContent"
                  aria-expanded="false" aria-label="Toggle navigation">
          </button>
          <div className="collapse navbar-collapse" id="navbarSupportedContent">
            <Search
              onSelectedIntervalChange={this.handleIntervalChange}
              onSelectedSubjectChange={this.handleSubjectChange}
            />
          </div>
        </nav>
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
