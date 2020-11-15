import React from 'react';
import 'font-awesome/css/font-awesome.min.css';
import './App.scss';
import Wiki from './Wiki.js';
import IntervalVisual from './IntervalVisual.js';
import SubjectVisual from './SubjectVisual.js';
import * as common from './common';

class App extends React.Component {

  constructor (props) {
    super(props);

    this.state = { interval: null };

    this.subjectVisualRef = React.createRef();
    this.handleIntervalChange = this.handleIntervalChange.bind(this);
    this.handleSubjectChange = this.handleSubjectChange.bind(this);
  }

  handleIntervalChange(interval) {
    this.setState({
      interval: interval,
      selected: {
        type: 'interval',
        item: interval
      }
    });
  }

  handleSubjectChange(subject) {
    console.log("Subject: ", subject ? subject._id : "none");
    this.setState({
      selected: {
        type: 'subject',
        item: subject
      }
    });
  }

  render() {
    return (
      <div className="app grid-container">
        <header className="header">
          <h3 className="header-title">EvoTempus: Dashboard of Earth History</h3>
          <form className="header-search form-inline">
            <input className="form-control search-term" type="text" placeholder="Search" aria-label="Search"/>
            <button className="fa fa-search search-button" type="submit"/>
          </form>
        </header>
        <main className="main">
          <div className="inner-main">
            <div className="main-visual">
              <div className="interval-visual">
                <IntervalVisual
                  width="400" height="400"
                  onSelectedIntervalChange={this.handleIntervalChange}
                />
              </div>
              <div className="subject-visual" ref={this.subjectVisualRef}>
                <SubjectVisual
                  parent = { this.subjectVisualRef }
                  interval={this.state.interval}
                  onSelectedSubjectChange={this.handleSubjectChange}
                />
              </div>
            </div>
            <div className="wiki-card">
              <Wiki
                topic={this.state.selected}
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
