import React from 'react';
import isEqual from 'lodash/isEqual';
import {hierarchy as d3Hierarchy, stratify as d3Stratify, partition as d3Partition} from 'd3-hierarchy';
import {interpolate as d3Interpolate, quantize as d3Quantize} from 'd3-interpolate';
import {select as d3Select} from 'd3-selection';
import {scaleLinear as d3ScaleLinear, scaleSqrt as d3ScaleSqrt} from 'd3-scale';
import {scaleOrdinal as d3ScaleOrdinal} from 'd3-scale';
import {interpolateRainbow as d3InterpolateRainbow} from 'd3-scale-chromatic';
import {arc as d3Arc} from 'd3-shape';
import {json as d3Json} from 'd3-fetch';
import {transition as d3Transition} from 'd3-transition';
import {format as d3Format} from 'd3-format';
import {color as d3Color} from 'd3-color';
import Loading from './loading/Loading.js';
import ErrorMsg from './ErrorMsg.js';
import * as api from './api';
import './IntervalVisual.scss';

export default class IntervalVisual extends React.Component {

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

  static getDerivedStateFromError(error) {
    const errorMsg = "Error received from Interval sunburst";
    console.log("Error: " + errorMsg + "\n Detail: " + error);
    return {
      errorMsg: errorMsg,
      error: error,
      loading: false
    };
  }

  componentDidCatch(error, info) {
    console.log(error);
  }

  componentDidMount() {
    //
    // Fetch the interval data from the backend service
    //
    api.intervals()
      .then((res) => {
        if (!res.data || res.data.length === 0) {
          this.logErrorState("Data failed to be fetched", new Error("Response data payload was empty."));
        } else {
          this.setState({
            loading: false,
            data: res.data
          })
        }
      }).catch((err) => {
        this.logErrorState("Failed to fetch interval data", err);
      });
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
      <SubjectSwimLane
        width = {this.props.width}
        height = {this.props.height}
        onSelectedSubjectChange = {this.props.onSelectedSubjectChange}
        data = {this.state.data}/>
    );
  }
}

class SubjectSwimLane extends React.Component {

  constructor(props) {
    super(props);

    // This binding is necessary to make `this` work in the callback
    // this.handleClick = this.handleClick.bind(this);
  }

  componentDidMount() {
    this.renderSwimlanes(this.props);
  }

  //
  // Renders the swimlanes once the data has been
  // successfully retrieved from the database
  //
  renderSwimlanes(props, data) {
    data = data ? data : this.props.data;

    this.width = props.width || 300;
    this.height = props.height || 300;

  }

  render() {
    return (
      <div id="evo-tempus-sw-div">

      </div>
    );
  }
}
