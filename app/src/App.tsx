import React from 'react';
import { useState, useEffect } from 'react';
import '@fortawesome/fontawesome-free/css/solid.css';
import '@fortawesome/fontawesome-free/css/fontawesome.css';
import '@fortawesome/fontawesome-free/css/v5-font-face.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.bundle.min.js';

import './App.scss';
import { AppContext } from './AppContext';
import {
  fetchService,
  hintService
} from '@evotempus/api';
import {
  FilteredCategory,
  Interval,
  Legend,
  Subject,
  TopicTarget,
} from '@evotempus/types';
import {
  Search,
  HelpPage
} from '@evotempus/components';
// import { Wiki, IntervalVisual, SubjectVisual } from '@evotempus/components';
import {
  consoleLog,
  present,
  isSubject,
  isInterval
} from '@evotempus/utils';
import wikiLogoV2 from '@evotempus/assets/images/wikipedia-logo-v2.svg';
import geoclock from '@evotempus/assets/images/geologic-clock.png';

interface AppProps {
}

export const App: React.FunctionComponent<AppProps> = () => {

  const [filteredCategories, setFilteredCategories] = useState<FilteredCategory[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | undefined>(undefined);
  const [error, setError] = useState<Error | undefined>(undefined);
  const [help, showHelp] = useState<boolean>(true);
  const [interval, setInterval] = useState<Interval | undefined>(undefined);
  const [legend, setLegend] = useState<Legend>({
    visible: false,
    activeTab: ''
  });
  const [subject, setSubject] = useState<Subject | undefined>(undefined);
  const [topicTarget, setTopicTarget] = useState<TopicTarget | undefined>(undefined);
  const [wikiVisible, showWiki] = useState<boolean>(false);
  const [wikiPosition, setWikiPosition] = useState<string | undefined>('interval');

  useEffect(() => {
    console.log('component mounted!')
    initHints();
    initCategories();
  },[])

  //
  // Fetch all the hints from the backend service
  // This needs to be done once then retained in HintService
  //
  const initHints = () => {
    fetchService.hints()
      .then((res) => {
        if (!res.data || res.data.length === 0) {
          logErrorState("Failed to fetch hints", new Error("Response data payload was empty."));
        } else {
          hintService.setHints(res.data);
        }
      }).catch((err) => {
        logErrorState("Failed to fetch hints data", err);
      });
  }

  //
  // Fetch all the categories from the backend service
  // This needs to be done once then retained and passed to the subject Swimlane component
  //
  const initCategories = () => {
    fetchService.subjectCategories()
      .then((res) => {
        if (!res.data || res.data.length === 0) {
          logErrorState("Failed to fetch categories be fetched", new Error("Response data payload was empty."));
        } else {
          const filteredCategories: FilteredCategory[] = []
          for (const category of res.data.values()) {
            filteredCategories.push({
              name: category,
              filtered: false
            });
          }
          setFilteredCategories(filteredCategories);
        }
      }).catch((err) => {
        logErrorState("Failed to fetch interval data", err);
      });
  }

  const logErrorState = (errorMsg: string, error: Error) => {
    consoleLog("Error: " + errorMsg + "\nDetail: ");
    consoleLog(error);
    setErrorMsg(errorMsg)
    setError(error)
  }

  const handleChange = (
    newInterval: Interval | undefined,
    newSubject?: Subject | undefined,
    newCategories?: FilteredCategory[] | undefined) => {

      if (newInterval) {
        consoleLog("App - handleChange: " + newInterval.name);
        consoleLog(newInterval);
      }
      if (newSubject) {
        consoleLog("App - handleChange: " + newSubject.name);
        consoleLog(newSubject);
      }

      if (! newCategories) {
        newCategories = filteredCategories;
      }

      if ((newInterval && interval && newInterval._id === interval._id) &&
          (newSubject && subject && newSubject._id === subject._id)) {
            // Nothing to do
            return;
      }

      setInterval(newInterval);
      setSubject(newSubject);
      setTopicTarget(subject ? subject : interval);
      setFilteredCategories(newCategories);
      showHelp(false);
  }

  //
  // changedCategories is array of {name: ..., filtered: true|false}
  //
  const updateCategoryFilter = (changedCategories: FilteredCategory[]) => {

    if (!changedCategories || changedCategories.length === 0) {
      return;
    }
    consoleLog("Set filter on categories: " + changedCategories[0].name + "  " + changedCategories[0].filtered);

    let copyCategories = [...filteredCategories];

    changedCategories.forEach((changedCategory: FilteredCategory) => {
      const idx = filteredCategories.findIndex(category => {
        return category.name === changedCategory.name;
      })

      if (idx === -1) {
        return;
      }

      let copyCat = {
        ...copyCategories[idx],
        filtered: changedCategory.filtered
      }

      copyCategories[idx] = copyCat;
    });

    handleChange(interval, undefined, copyCategories);
  }

  const onUpdateLegend = (legend: Legend) => {
    setLegend(legend);
  }

  /*
   * Used by the mobile version to open the wiki
   *
   * type: determines which button was clicked to open the wiki (interval or subject)
   */
  const handleWikiClick = (event: any, type: string) => {
    toggleWiki(event, type);
    event.stopPropagation();
  }

  /*
   * Used when display in mobile and the wiki is a dialog
   * displayed using the wiki button
   */
   // eslint-disable-next-line @typescript-eslint/ban-ts-comment
   // @ts-ignore
  const toggleWiki = (event: any, type: string | undefined) => {
    if (!type) {
      type = wikiPosition;
    }

    showWiki(! wikiVisible);
    setWikiPosition(type);
  }

  const toggleHelp = () => {
    showHelp(! help);
  }

    // const intervalVisual = (
    //   <IntervalVisual
    //     parent = { this.intervalVisualRef }
    //     width="312" height="185"
    //     interval={this.state.interval}
    //     onSelectedIntervalChange={this.handleIntervalChange}
    //     onSelectedChange={this.handleChange}
    //   />
    // )
    //
  const subjectViz = (
    <></>
    //   <SubjectVisual
    //     parent = { this.subjectVisualRef }
    //     interval={this.state.interval}
    //     subject={this.state.subject}
    //     categories={this.state.categories}
    //     legend={this.state.legend}
    //     onSelectedChange={this.handleChange}
    //     onUpdateCategoryFilter={this.updateCategoryFilter}
    //     onUpdateLegend={this.onUpdateLegend}
    //   />
  )

  const helpPage = (
    <HelpPage onToggleHelp={toggleHelp}/>
  )

  const subjectHelpVisual = help ? helpPage : subjectViz;

  return (
    <div className="app grid-container">
      <nav className="header navbar navbar-expand-lg">
        <div className="container-fluid">
          <p className="header-title">EvoTempus</p>
          <p className="header-title collapse navbar-collapse">Dashboard of Earth History</p>
          <button id="collapsible" className="navbar-toggler fas fa-bars" type="button"
                  data-bs-toggle="collapse" data-bs-target="#navbarSupportedContent"
                  aria-controls="navbarSupportedContent" aria-expanded="false" aria-label="Toggle navigation">
          </button>
          <div className="collapse navbar-collapse" id="navbarSupportedContent">
            <Search
              onSelectedChange={handleChange}
            />
          </div>
        </div>
      </nav>

      <div className="interval-visual-group">
        <div className="interval-visual-help">
          <button id="interval-visual-help-btn" className="fas fa-question-circle" onClick={() => toggleHelp()}/>
        </div>
        <div className="interval-visual">
          {/*intervalVisual*/}
          <div id="interval-wiki-card-btn-container" className={topicTarget && isInterval(topicTarget) ? 'show' : 'hide'}>
            <button id="interval-wiki-card-btn" onClick={(event) => handleWikiClick(event, "interval")}>
              <img src={wikiLogoV2} alt="W"/>
            </button>
          </div>
        </div>
      </div>
      <div className="subject-visual">
        {subjectHelpVisual}
        <div id="subject-wiki-card-btn-container" className={topicTarget && isSubject(topicTarget) ? 'show' : 'hide'}>
          <button id="subject-wiki-card-btn" onClick={(event) => handleWikiClick(event, "subject")}>
            <img src={wikiLogoV2} alt="W"/>
          </button>
        </div>
      </div>

      <footer className="footer">
        <p id="app-footer-copyright">
          &copy; P. G. Richardson {present(2030)} - Licensed under <a href="https://www.gnu.org/licenses/gpl-3.0.en.html">GPL 3.0 or later</a>
        </p>
        <a id="app-footer-logo" href="https://en.wikipedia.org/wiki/Geologic_time_scale"
          target="_blank" rel="noopener noreferrer">
          <img src={geoclock} alt="geo-clock"/>
        </a>
      </footer>
    </div>
  );
}
