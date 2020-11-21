import React from 'react';
import './Search.scss';
import ErrorMsg from './ErrorMsg.js';
import * as api from './api';
import * as common from './common';

export default class Search extends React.Component {

  constructor (props) {
    super(props);

    this.state = {
      searchTerm: '',
      results: {
        msg: '',
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
            results: { msg : "No results found" },
            resultsClass: 'search-results-show'
          })
        } else {

          const total = res.data.intervals.length + res.data.subjects.length + res.data.topics.length;
          this.setState({
            results: {
              msg: "Found " + total + " results",
              intervals: res.data.intervals,
              subjects: res.data.subjects,
              topics: res.data.topics
            },
            resultsClass: 'search-results-show'
          })
        }
      }).catch((err) => {
        this.setState({
          results: {
            msg: "An error occurred whilst searching",
            error: err
          },
          resultsClass: 'search-results-show'
        })
      });

    event.preventDefault();
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

    switch (target.fieldType) {
      case 'interval':
        this.props.onSelectedIntervalChange(target);
        break;
      case 'subject':
        api.intervalEncloses(target.from, target.to)
          .then((res) => {
            if (!res.data || res.data.length === 0) {
              this.setState({
                results: { msg : "Error: Cannot navigate to a parent interval of the subject" }
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
              results: {
                msg: "An error occurred whilst trying to navigate to subject",
                error: err
              }
            })
          });

        break;
      case 'topic':
        if (target.topicTarget === 'Subject') {
          api.subjectById(target.topic)
            .then((res) => {
              if (!res.data) {
                this.setState({
                  results: { msg : "Error: Cannot navigate to a parent subject of the description" }
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
                results: {
                  msg: "An error occurred whilst trying to navigate to description",
                  error: err
                }
              })
            });

        } else if (target.topicTarget === 'Interval') {
          api.intervalById(target.topic)
            .then((res) => {
              if (!res.data) {
                this.setState({
                  results: { msg : "Error: Cannot navigate to a parent interval of the description" }
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
                results: {
                  msg: "An error occurred whilst trying to navigate to description",
                  error: err
                }
              })
            });
        }

        break;
      default:
        console.log("Cannot navigate to unknown result");
    }
  }

  resultBlock(title, type, content) {
    if (!content || content.length === 0) {
      return '';
    }

    const myclass = "search-results-content-" + title.toLowerCase();
    const items = [];
    for (const value of content.values()) {
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

    return (
      <div className={myclass}>
        <ul aria-label={title}>
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

    if (this.state.results.error) {
      return (
        <div className="evo-search">
          {searchBox}
          <div className={"search-results " + this.state.resultsClass}>
            <div className="search-results-inner">
              {closeButton}
              <div className="search-results-content">
                <ErrorMsg error = {this.state.results.error} errorMsg = {this.state.results.msg}/>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="evo-search">
        {searchBox}
        <div className={"search-results " + this.state.resultsClass}>
          <div className="search-results-inner">
            {closeButton}
            <div className="search-results-content">
              <h3>{this.state.results.msg}</h3>

              {this.resultBlock("Geological Intervals", "interval", this.state.results.intervals)}
              {this.resultBlock("Historical Subjects", "subject", this.state.results.subjects)}
              {this.resultBlock("Descriptions", "topic", this.state.results.topics)}
            </div>
          </div>
        </div>
      </div>
    );
  }
}
