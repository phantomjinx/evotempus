import React from 'react';
import Loading from './loading/Loading.js';
import ErrorMsg from './ErrorMsg.js';
import * as api from './api.js';
import * as common from './common';
import './Wiki.scss';
import geoclock from './images/geologic-clock.png';
import wikiLogo from './images/wikipedia-logo-with-label.svg';

export default class Wiki extends React.Component {

  constructor(props) {
    super(props);

    const clickMsg = "To read further, click here";

    this.state = {
      linkId : 'Geologic_time_scale',
      loading: true,
      clickMsg: clickMsg
    };
  }

  logErrorState(errorMsg, error) {
    common.consoleLog("Error: " + errorMsg + "\nDetail: ");
    common.consoleLog(error);
    this.setState({
      errorMsg: errorMsg,
      error: error,
      loading: false
    });
  }

  fetchDescription() {
    const topic = this.props.topic;
    if (!topic) {
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

    api.description(topic.type, topic.item._id)
      .then((res) => {
        if (!res.data || res.data.length === 0) {
          this.logErrorState("Description cannot be displayed", new Error("No description could be loaded."));
        } else {
          this.setState({
            loading: false,
            description: res.data.description,
            linkId: res.data.linkId
          })
        }
      }).catch((err) => {
        this.logErrorState("Failed to fetch description", err);
      });
  }

  componentDidMount() {
    this.fetchDescription();
  }

  componentDidUpdate(prevProps) {
    if (this.props.topic !== prevProps.topic) {
      this.fetchDescription();
    }
  }

  displayDefn() {
    if (! this.props.topic) {
      return "";
    }

    if (Math.abs(this.props.topic.item.from) > common.million || Math.abs(this.props.topic.item.to) > common.million) {
      return this.state.maDefn;
    }

    return "";
  }

  displayDates() {
    if (! this.props.topic) {
      return "";
    }

    return "from approximately " + common.present(this.props.topic.item.from) + " to " + common.present(this.props.topic.item.to);
  }

  displayHeaderTitle() {
    var title = this.props.topic ? this.props.topic.item.name : "";
    var dates = this.displayDates();
    return title + " " + dates;
  }

  render() {

    const headerLogo = (
      <a id="wiki-header-logo" href="https://en.wikipedia.org/wiki/Geologic_time_scale"
        target="_blank" rel="noopener noreferrer">
        <img src={geoclock} alt="geo-clock"/>
      </a>
    )

    const headerText = (
      <p id="wiki-header-title" className="fade-in">{this.displayHeaderTitle()}</p>
    )

    const headerButton = (
      <button
        id="wiki-closebtn" className="fas fa-times"
        onClick={this.props.onToggleWiki}>
      </button>
    )

    const header = (
      <div id="wiki-header">
        {headerButton}
        {headerLogo}
        {headerText}
      </div>
    )

    const footer = (
      <div id="wiki-footer">
        <a id="wiki-footer-logo" href={common.wikiLink + this.state.linkId} target="_blank" rel="noopener noreferrer">
          <img src={wikiLogo} alt="Wikipedia"/>
        </a>
        <p id="link-instruction-arrow">&rarr;</p>
        <p id="link-instruction-text">{this.state.clickMsg}</p>

        <p id="unit-defn" className="fade-in">
          <span>
            <a href={common.wikiLink + "Year#SI_prefix_multipliers"} target="_blank" rel="noopener noreferrer">
              Ma: 1 million years
            </a>
          </span>
          <span>
            <a href={common.wikiLink + "Year#SI_prefix_multipliers"} target="_blank" rel="noopener noreferrer">
              ka: 1 thousand years
            </a>
          </span>
        </p>
      </div>
    )

    if (this.state.loading) {
      return (
        <div id="wiki-container">
          <div id="wiki-header">
            {headerLogo}
            {headerButton}
            <p id="ma-defn" className="disappear"/>
            <h3 id="wiki-header-dates" className="disappear">None</h3>
            <h3 id="wiki-header-title" className="disappear">None</h3>
          </div>
          <div id="wiki-main">
            <div id="wiki-main-inner">
              <div id="wiki-loading" className="fade-in">
                <Loading/>
              </div>
              <div id="wiki-text" className="disappear"/>
            </div>
          </div>
          {footer}
        </div>
      );
    }

    if (this.state.error) {
      return (
        <div id="wiki-container">
          {header}
          <div id="wiki-main">
            <div id="wiki-main-inner">
              <div id="wiki-loading" className="disappear"/>
              <div id="wiki-text" className="fade-in">
                <ErrorMsg error = {this.state.error} errorMsg = {this.state.errorMsg}/>
              </div>
            </div>
          </div>
          {footer}
        </div>
      );
    }

    if (this.props.topic) {
      return (
        <div id="wiki-container">
          {header}
          <div id="wiki-main">
            <div id="wiki-main-inner">
              <div id="wiki-loading" className="disappear"/>
              <div id="wiki-text" className="fade-in">
                <p>{this.state.description}</p>
              </div>
            </div>
          </div>
          {footer}
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
