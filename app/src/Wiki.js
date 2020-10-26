import React from 'react';
import Loading from './loading/Loading.js';
import ErrorMsg from './ErrorMsg.js';
import * as api from './api.js';
import './Wiki.css';

export default class Wiki extends React.Component {

  constructor(props) {
    super(props);

    const clickMsg = "To read more detail, click the wikipedia link in the footer.";
    this.state = {
      loading: true,
      clickMsg: clickMsg
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
          </div>
          <div>
            <div id="wiki-main">
              <div id="wiki-main-inner">
                <p>{this.state.description}</p>
                <p id="wiki-main-inner-instruction">{this.state.clickMsg}</p>
              </div>
            </div>
          </div>
          <div id="wiki-footer">
            <a id="wiki-footer-logo" href={this.state.link} target="_blank" rel="noopener noreferrer">
              <img src="/wikipedia-logo-with-label.svg"/>
            </a>
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
