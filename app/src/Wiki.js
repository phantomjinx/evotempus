import React from 'react';
import Loading from './loading/Loading.js';
import ErrorMsg from './ErrorMsg.js';
import * as api from './api.js';

export default class Wiki extends React.Component {

  constructor(props) {
    super(props);

    this.state = { loading: true };
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
      console.log("No interval selected");
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

    api.description(interval)
      .then((res) => {
        console.log(res);
        if (!res.data || res.data.length == 0) {
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
    console.log("calling componentDidMount");
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
        <ErrorMsg error = {this.state.error} errorMsg = {this.state.errorMsg}/>
      );
    }

    return (
      <div>
        <p>{this.state.description}</p>
        <p><a href={this.state.link}>{this.state.link}</a></p>
      </div>
    );
  }
}
