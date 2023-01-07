import React from 'react';
import '@fortawesome/fontawesome-free/css/solid.css';
import '@fortawesome/fontawesome-free/css/fontawesome.css';
import '@fortawesome/fontawesome-free/css/v5-font-face.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.bundle.min.js';

import './App.scss';
import {
  HintService,
  FetchService,
} from '@evotempus/api';
import {
  FilteredCategory,
  Interval,
  Legend,
  Subject,
  TopicTarget,
} from '@evotempus/types';
// import { Search, Wiki, IntervalVisual, SubjectVisual, HelpPage } from '@evotempus/components';
import { consoleLog, present } from '@evotempus/utils';
// import wikiLogoV2 from './assets/images/wikipedia-logo-v2.svg';
import geoclock from './assets/images/geologic-clock.png';

interface AppProps {
}

interface AppState {
  categories: FilteredCategory[],
  errorMsg?: string,
  error?: Error,
  help: boolean,
  hintService: HintService | undefined,
  interval: Interval | undefined,
  legend: Legend,
  subject: Subject | undefined,
  topicTarget: TopicTarget | undefined,
  wikiVisible: boolean,
  wikiPosition: string
}

export default class App extends React.Component<AppProps, AppState> {

  state: AppState = {
    /*
    * empty array of category objects
    * with schema { id (string), name (string), filtered (boolean) }
    */
    categories: [],
    help: true,
    hintService: undefined,
    interval: undefined,
    legend: {
      visible: false,
      activeTab: ''
    },
    subject: undefined,
    topicTarget: undefined,
    wikiVisible: false,
    wikiPosition: "interval"
  };

  private fetchService: FetchService = new FetchService();

  // private intervalVisualRef = React.createRef<App>();
  // private subjectVisualRef = React.createRef<App>();

  constructor (props: AppProps) {
    super(props);
  }

  logErrorState(errorMsg: string, error: Error) {
    consoleLog("Error: " + errorMsg + "\nDetail: ");
    consoleLog(error);
    this.setState({
      errorMsg: errorMsg,
      error: error
    });
  }

  //
  // Fetch all the hints from the backend service
  // This needs to be done once then retained in HintService
  //
  private initHints() {
    this.fetchService.hints()
      .then((res) => {
        if (!res.data || res.data.length === 0) {
          this.logErrorState("Failed to fetch hints", new Error("Response data payload was empty."));
        } else {
          const hintService: HintService = new HintService(res.data);
          this.setState({
            hintService: hintService
          });
        }
      }).catch((err) => {
        this.logErrorState("Failed to fetch hints data", err);
      });
  }

  //
  // Fetch all the categories from the backend service
  // This needs to be done once then retained and passed to the subject Swimlane component
  //
  private initCategories() {
    this.fetchService.subjectCategories()
      .then((res) => {
        if (!res.data || res.data.length === 0) {
          this.logErrorState("Failed to fetch categories be fetched", new Error("Response data payload was empty."));
        } else {
          let catObjs: FilteredCategory[] = [];
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
    this.initHints();
    this.initCategories();
  }

  handleChange = (interval: Interval | undefined, subject: Subject | undefined, categories: FilteredCategory[]) => {
    if (interval) {
      consoleLog("App - handleChange: " + interval.name);
      consoleLog(interval);
    }
    if (subject) {
      consoleLog("App - handleChange: " + subject.name);
      consoleLog(subject);
    }

    if (! categories) {
      categories = this.state.categories;
    }

    if ((interval && this.state.interval && interval._id === this.state.interval._id) &&
        (subject && this.state.subject && subject._id === this.state.subject._id)) {
        // Nothing to do
      return;
    }

    this.setState({
      interval: interval,
      subject: subject,
      topicTarget: subject ? subject : interval,
      categories: categories,
      help: false
    });
  }

  //
  // changedCategories is array of {name: ..., filtered: true|false}
  //
  updateCategoryFilter = (changedCategories: FilteredCategory[]) => {

    if (!changedCategories || changedCategories.length === 0) {
      return;
    }
    consoleLog("Set filter on categories: " + changedCategories[0].name + "  " + changedCategories[0].filtered);

    let copyCategories = [...this.state.categories];

    changedCategories.forEach((changedCategory: FilteredCategory) => {
      const idx = this.state.categories.findIndex(category => {
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

    this.handleChange(this.state.interval, undefined, copyCategories);
  }

  onUpdateLegend = (legend: Legend) => {
    this.setState({
      legend: legend
    });
  }

  /*
   * Used by the mobile version to open the wiki
   *
   * type: determines which button was clicked to open the wiki (interval or subject)
   */
  handleWikiClick = (event: any, type: string) => {
    this.toggleWiki(event, type);
    event.stopPropagation();
  }
  //
  /*
   * Used when display in mobile and the wiki is a dialog
   * displayed using the wiki button
   */
   // eslint-disable-next-line @typescript-eslint/ban-ts-comment
   // @ts-ignore
  toggleWiki = (event: any, type: string) => {
    if (!type) {
      type = this.state.wikiPosition;
    }

    this.setState({
      wikiVisible: !this.state.wikiVisible,
      wikiPosition: type
    });
  }

  toggleHelp = () => {
    this.setState({
      help: ! this.state.help
    });
  }

  render() {
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
    // const subjectViz = (
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
    // )
    //
    // const showHelp = (
    //   <HelpPage
    //     onToggleHelp={this.toggleHelp}
    //   />
    // )
    //
    // const subjectVisual = this.state.help ? showHelp : subjectViz;

    return (
      <div className="app grid-container">




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
}
