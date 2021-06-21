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
      /*
       * empty array of category objects
       * with schema { id (string), name (string), filtered (boolean) }
       */
      categories: [],
      subject: undefined,
      legendVisible: false,
      wikiVisible: false,
      wikiPosition: "interval"
    };

    this.intervalVisualRef = React.createRef();
    this.subjectVisualRef = React.createRef();
    this.handleIntervalChange = this.handleIntervalChange.bind(this);
    this.handleSubjectChange = this.handleSubjectChange.bind(this);
    this.updateCategoryFilter = this.updateCategoryFilter.bind(this);
    this.onUpdateLegendVisible = this.onUpdateLegendVisible.bind(this);
    this.handleWikiClick = this.handleWikiClick.bind(this);
    this.toggleWiki = this.toggleWiki.bind(this);
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

  //
  // Fetch all the categories from the backend service
  // This needs to be done once then retained and passed to the subject Swimlane component
  //
  fetchCategories() {
    api.subjectCategories()
      .then((res) => {
        if (!res.data || res.data.length === 0) {
          this.logErrorState("Failed to fetch categories be fetched", new Error("Response data payload was empty."));
        } else {
          let catObjs = [];
          for (const category of res.data.values()) {
            catObjs.push({
              name: category,
              filtered: false
            });
          }

          this.setState({
            categories: catObjs
          })
        }
      }).catch((err) => {
        this.logErrorState("Failed to fetch interval data", err);
      });
  }

  componentDidMount() {
    this.fetchHints();
    this.fetchCategories();
  }

  handleIntervalChange(interval) {
    if (interval && this.state.interval && interval._id === this.state.interval._id) {
      // Nothing to do
      return;
    }

    //
    // Reset the subject since the interval may not contain it.
    // Keeping it puts 'focus' back on to it when the interval
    // has been changed. To restore such focus, handleSubjectChange
    // should be called after this.
    //
    this.setState({
      interval: interval,
      subject: null,
      topicTarget: {
        type: 'interval',
        item: interval
      },
      help: false
    });
  }

  updateCategoryFilter(names, filter) {
    if (!names || names.length === 0) {
      return;
    }

    let copyCategories = [...this.state.categories];

    names.forEach(name => {
      const idx = this.state.categories.findIndex(category => {
        return category.name === name;
      })

      if (idx === -1) {
        return;
      }

      let copyCat = {
        ...copyCategories[idx],
        filtered: filter
      }

      copyCategories[idx] = copyCat;
    });

    this.setState({
      categories: copyCategories
    });
  }

  onUpdateLegendVisible(visible) {
    console.log("Setting legend visible state: " + visible);
    this.setState({
      legendVisible: visible
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

  /*
   * Used by the mobile version to open the wiki
   *
   * type: determines which button was clicked to open the wiki (interval or subject)
   */
  handleWikiClick(event, type) {
    this.toggleWiki(event, type);
    event.stopPropagation();
  }

  /*
   * Used when display in mobile and the wiki is a dialog
   * displayed using the wiki button
   */
  toggleWiki(event, type) {
    if (!type) {
      type = this.state.wikiPosition;
    }

    this.setState({
      wikiVisible: !this.state.wikiVisible,
      wikiPosition: type
    });
  }

  toggleHelp(show) {
    this.setState({
      help: show
    });

  }

  render() {
    const intervalVisual = (
      <IntervalVisual
        parent = { this.intervalVisualRef }
        width="312" height="185"
        interval={this.state.interval}
        onSelectedIntervalChange={this.handleIntervalChange}
      />
    )

    const subjectViz = (
      <SubjectVisual
        parent = { this.subjectVisualRef }
        interval={this.state.interval}
        subject={this.state.subject}
        categories={this.state.categories}
        legendVisible={this.state.legendVisible}
        onSelectedIntervalChange={this.handleIntervalChange}
        onSelectedSubjectChange={this.handleSubjectChange}
        onUpdateCategoryFilter={this.updateCategoryFilter}
        onUpdateLegendVisible={this.onUpdateLegendVisible}
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
        <div className="interval-visual-group">
          <div className="interval-visual-help">
            <button id="interval-visual-help-btn" className="fa fa-question-circle" onClick={() => this.toggleHelp(true)}/>
          </div>
          <div className="interval-visual" ref={this.intervalVisualRef}>
            {intervalVisual}
            <div id="interval-wiki-card-btn-container" className={this.state.topicTarget && this.state.topicTarget.type === 'interval' ? 'show' : 'hide'}>
              <button id="interval-wiki-card-btn" onClick={(event) => this.handleWikiClick(event, "interval")}>
                <img src="/wikipedia-logo-v2.svg" alt="W"/>
              </button>
            </div>
          </div>
        </div>
        <div className="subject-visual" ref={this.subjectVisualRef}>
          {subjectVisual}
          <div id="subject-wiki-card-btn-container" className={this.state.topicTarget && this.state.topicTarget.type === 'subject' ? 'show' : 'hide'}>
            <button id="subject-wiki-card-btn" onClick={(event) => this.handleWikiClick(event, "subject")}>
              <img src="/wikipedia-logo-v2.svg" alt="W"/>
            </button>
          </div>
        </div>
        <div id="wiki-card" className={`${this.state.wikiVisible ? 'show' : 'hide'} ${this.state.wikiPosition}`}>
          <Wiki
            topic={this.state.topicTarget}
            onToggleWiki = {this.toggleWiki}
          />
        </div>
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
