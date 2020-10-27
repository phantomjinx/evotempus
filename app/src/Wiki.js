import React from 'react';
import Loading from './loading/Loading.js';
import ErrorMsg from './ErrorMsg.js';
import * as api from './api.js';
import * as common from './common';
import './Wiki.scss';

export default class Wiki extends React.Component {

  constructor(props) {
    super(props);

    const maDefn =
      "<a href=\"https://en.wikipedia.org/wiki/Year#SI_prefix_multipliers\" target=\"_blank\" rel=\"noopener noreferrer\">(Ma: 1 million years)</a>";
    const clickMsg = "To read more detail, click the wikipedia icon";
    this.state = {
      loading: true,
      clickMsg: clickMsg,
      maDefn: maDefn
    };
  }

  logErrorState(errorMsg, error) {
    console.log("Error: " + errorMsg + "\n Detail: " + error);
    this.setState({
      errorMsg: errorMsg,
      error: error,
      loading: false
    });
  }

  fetchDescription() {
    const interval = this.props.interval;
    if (!interval) {
      this.setState({
        loading: false,
        error: null,
        errorMsg: ''
      });

      return;
    }

    this.setState({
      loading: true,
      error: null,
      errorMsg: ''
    });

    api.description(interval._id)
      .then((res) => {
        if (!res.data || res.data.length === 0) {
          this.logErrorState("Data failed to be fetched", new Error("Response data payload was empty."));
        } else {
          this.setState({
            loading: false,
            description: res.data.description,
            link: res.data.link
          })
        }
      }).catch((err) => {
        this.logErrorState("Failed to fetch interval data", err);
      });
  }

  componentDidMount() {
    this.fetchDescription();
  }

  componentDidUpdate(prevProps) {
    if (this.props.interval !== prevProps.interval) {
      this.fetchDescription();
    }
  }

  present(year) {
    return (year === 2030) ? new Date().getFullYear() : common.displayYear(year);
  }

  displayDefn() {
    if (Math.abs(this.props.interval.from) > common.million || Math.abs(this.props.interval.to) > common.million) {
      return this.state.maDefn;
    }

    return "";
  }

  render() {

    if (this.state.loading) {
      return (
        <Loading/>
      );
    }

    if (this.state.error) {
      return (
        <div id="wiki-article">
          <ErrorMsg error = {this.state.error} errorMsg = {this.state.errorMsg}/>
        </div>
      );
    }

    if (this.props.interval) {
      return (
        <div id="wiki-article">
          <div id="wiki-header">
            <h6 id="wiki-header-title">{this.props.interval.name}</h6>
            <a id="wiki-header-logo" href="https://en.wikipedia.org/wiki/Geologic_time_scale"
              target="_blank" rel="noopener noreferrer">
              <img src="/geologic-clock.png" alt="geo-clock"/>
            </a>
            <h6 id="wiki-header-dates">from {this.present(this.props.interval.from)} to {this.present(this.props.interval.to)}</h6>
            <p id="ma-defn" dangerouslySetInnerHTML={{__html: this.displayDefn()}}/>
          </div>
          <div id="wiki-main">
            <div id="wiki-main-inner">
              <p>{this.state.description}</p>
            </div>
          </div>
          <div id="wiki-footer">
            <a id="wiki-footer-logo" href={this.state.link} target="_blank" rel="noopener noreferrer">
              <img src="/wikipedia-logo-with-label.svg" alt="Wikipedia"/>
            </a>
            <p id="link-instruction">{this.state.clickMsg} &rarr;</p>
          </div>
        </div>
      );
    } else {
      return (
        <div>
        </div>
      );
    }
  }
}
