import React from 'react';
import './Search.scss';
import ErrorMsg from './ErrorMsg.js';
import Tabs from "./Tabs.js";
import * as api from './api';
import * as common from './common';
import Pagination from "react-pagination-js";
import "react-pagination-js/dist/styles.css"; // import css

export default class Search extends React.Component {

  constructor (props) {
    super(props);

    this.totalPerPage = 10;
    this.pageFn = {
      interval: (newPage) => {
        this.setState({ intervalPage: newPage });
      },
      subject: (newPage) => {
        this.setState({ subjectPage: newPage });
      },
      topic: (newPage) => {
        this.setState({ topicPage: newPage });
      }
    };

    this.state = {
      searchTerm: '',
      msg: '',
      error: undefined,
      intervalPage: 1,
      subjectPage: 1,
      topicPage: 1,
      results: {
        intervals: [],
        subjects: [],
        topics: []
      },
      resultsClass: 'search-results-hide'
    };

    this.handleSearch = this.handleSearch.bind(this);
    this.handleChange = this.handleChange.bind(this);
    this.closeSearchResults = this.closeSearchResults.bind(this);
    this.handleNavigate = this.handleNavigate.bind(this);
  }

  handleSearch(event) {
    if (!this.state.searchTerm) {
      return;
    }

    this.setState({ resultsClass: 'search-results-waiting' });

    //
    // Search the backend service
    //
    api.search(this.state.searchTerm)
      .then((res) => {
        if (!res.data || res.data.length === 0) {
          this.setState({
            msg : "No results found",
            resultsClass: 'search-results-show'
          })
        } else {

          this.setState({
            msg: this.resultsMsg(res.data.intervals, res.data.subjects, res.data.topics),
            msgClass: "search-msg-info",
            intervalPage: 1,
            subjectPage: 1,
            topicPage: 1,
            results: {
              intervals: res.data.intervals,
              subjects: res.data.subjects,
              topics: res.data.topics,
            },
            resultsClass: 'search-results-show'
          })
        }
      }).catch((err) => {
        this.setState({
          msg: "An error occurred whilst searching",
          msgClass: "search-msg-error",
          error: err,
          resultsClass: 'search-results-show'
        })
      });

    event.preventDefault();
  }

  resultsMsg(intervals, subjects, topics) {
    const total = (intervals ? intervals.length : 0) +
                  (subjects ? subjects.length : 0) +
                  (topics ? topics.length : 0);
    return "Found " + total + " results";
  }

  handleChange(event) {
    this.setState({searchTerm: event.target.value});
  }

  closeSearchResults() {
    this.setState({resultsClass: 'search-results-hide'});
  }

  handleNavigate(target, event) {
    if (event) {
      event.preventDefault();
    }

    this.setState({
      msg: this.resultsMsg(this.state.results.intervals, this.state.results.subjects, this.state.results.topics)
    });

    switch (target.fieldType) {
      case 'interval':
        this.props.onSelectedIntervalChange(target);
        break;
      case 'subject':
        api.intervalEncloses(target.from, target.to)
          .then((res) => {
            if (!res.data || res.data.length === 0) {
              this.setState({
                msg : "Error: Cannot navigate to a parent interval of the subject"
              })
            } else {
              //
              // Selected the returned interval
              //
              this.props.onSelectedIntervalChange(res.data[0]);
              this.props.onSelectedSubjectChange(target);
            }
          }).catch((err) => {
            this.setState({
              msg: "An error occurred whilst trying to navigate to subject",
              msgClass: "search-msg-error",
              error: err
            })
          });

        break;
      case 'topic':
        if (target.topicTarget === 'Subject') {
          api.subjectById(target.topic)
            .then((res) => {
              if (!res.data) {
                this.setState({
                  msg : "Error: Cannot navigate to a parent subject of the description"
                })
              } else {
                //
                // Navigate to the returned interval
                //
                const subject = res.data;
                subject.fieldType = 'subject';
                this.handleNavigate(subject, null);
              }
            }).catch((err) => {
              this.setState({
                msg: "An error occurred whilst trying to navigate to description",
                msgClass: "search-msg-info",
                error: err
              })
            });

        } else if (target.topicTarget === 'Interval') {
          api.intervalById(target.topic)
            .then((res) => {
              if (!res.data) {
                this.setState({
                  msg : "Error: Cannot navigate to a parent interval of the description"
                })
              } else {
                //
                // Navigate to the returned interval
                //
                const interval = res.data;
                interval.fieldType = 'interval';
                this.handleNavigate(interval, null);
              }
            }).catch((err) => {
              this.setState({
                msg: "An error occurred whilst trying to navigate to description",
                msgClass: "search-msg-error",
                error: err
              })
            });
        }

        break;
      default:
        this.setState({
          msg: "Cannot navigate to unknown result",
          msgClass: "search-msg-error"
        });
    }
  }

  hasResults() {
    return this.state.results.intervals.length > 0 ||
        this.state.results.subjects.length > 0 ||
        this.state.results.topics.length > 0;
  }

  resultBlock(title, type, results) {
    const myClass = "search-results-content-" + title.toLowerCase();
    let items = [];

    if (results.length === 0) {
      items.push(
        <p className="search-results-content-none-found">No results found for this category.</p>
      )
    }
    for (const value of results.values()) {
      //
      // Add a type field to help with navigation
      //
      value.fieldType = type;

      const label = value.topic ? value.topic : value.name;
      items.push(
        <li key={value._id}>
          <a href="#" onClick={this.handleNavigate.bind(this, value)}>
            {common.idToTitle(label)}
          </a>
        </li>
      );
    }

    let paginate = '';
    if (items.length > this.totalPerPage) {
      const currentPage = type + 'Page';
      const offset = (this.state[currentPage] - 1) * this.totalPerPage;
      items = items.slice(offset, offset + this.totalPerPage);
      paginate = (
        <Pagination
          currentPage={this.state[currentPage]}
          totalSize={results.length}
          sizePerPage={this.totalPerPage}
          changeCurrentPage={this.pageFn[type]}
          theme="circle"
        />
      );
    }

    return (
      <div label={title} className={myClass}>
        {paginate}
        <ul className="search-results-content-items">
          {items}
        </ul>
      </div>
    )
  }

  render() {
    const searchBox = (
      <div className="search-box">
        <form className="search-form form-inline" onSubmit={this.handleSearch}>
          <input className="form-control search-term"
            type="text"
            placeholder="Search"
            aria-label="Search"
            value={this.state.searchTerm}
            onChange={this.handleChange}
          />
          <button className="fa fa-search search-button" type="submit"/>
        </form>
      </div>
    );

    const closeButton = (
      <div>
        <a href="#"
          className="search-results-closebtn fa fa-times"
          onClick={this.closeSearchResults}>
        </a>
      </div>
    );

    if (this.state.error) {
      return (
        <div className="evo-search">
          {searchBox}
          <div className={"search-results " + this.state.resultsClass}>
            <div className="search-results-inner">
              {closeButton}
              <div className="search-results-content">
                <ErrorMsg error = {this.state.error} errorMsg = {this.state.msg}/>
              </div>
            </div>
          </div>
        </div>
      );
    }

    let resultsTabs = '';
    if (this.hasResults()) {
      resultsTabs = (
        <Tabs>
          {this.resultBlock("Geological Intervals", "interval", this.state.results.intervals)}
          {this.resultBlock("Historical Subjects", "subject", this.state.results.subjects)}
          {this.resultBlock("Descriptions", "topic", this.state.results.topics)}
        </Tabs>
      )
    }

    return (
      <div className="evo-search">
        {searchBox}
        <div className={"search-results " + this.state.resultsClass}>
          <div className="search-results-inner">
            {closeButton}
            <div className="search-results-content">
              <h3 className={this.state.msgClass}>{this.state.msg}</h3>
              {resultsTabs}
            </div>
          </div>
        </div>
      </div>
    );
  }
}
