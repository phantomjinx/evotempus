import React from 'react';
import isEqual from 'lodash/isEqual';
import {axisTop as d3AxisTop} from 'd3-axis';
import {
  range as d3Range,
  ascending as d3Ascending,
  extent as d3Extent} from 'd3-array';
import {format as d3Format} from 'd3-format';
import {timeHour as d3TimeHour} from 'd3-time';
import {
  scaleOrdinal as d3ScaleOrdinal,
  scaleLinear as d3ScaleLinear } from 'd3-scale';
import {
  schemeCategory10 as d3SchemeCategory10,
  schemePastel1 as d3SchemePastel1
} from 'd3-scale-chromatic';
import {
  namespace as d3Namespace,
  namespaces as d3Namespaces,
  select as d3Select} from 'd3-selection';
import {zoom as d3Zoom} from 'd3-zoom'
import {json as d3Json} from 'd3-fetch';
import {transition as d3Transition} from 'd3-transition';
import Loading from './loading/Loading.js';
import ErrorMsg from './ErrorMsg.js';
import * as api from './api';
import * as common from './common';
import './SubjectVisual.scss';

export default class SubjectVisual extends React.Component {

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
    const errorMsg = "Error received from Subject Visual";
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

  fetchSubjects() {
    this.setState({
      loading: true,
      errorMsg: "",
      error: null,
    })

    if (this.props.interval == null) {
      this.setState({
        loading: false,
        subjects: []
      })
      return;
    }

    //
    // Fetch the subject data from the backend service
    //
    api.subjects(this.props.interval.from, this.props.interval.to)
      .then((res) => {
        if (!res.data || res.data.length === 0) {
          this.setState({
            loading: false,
            subjects: []
          })
        } else {
          this.setState({
            loading: false,
            subjects: res.data
          })
        }
      }).catch((err) => {
        this.logErrorState("Failed to fetch interval data", err);
      });
  }

  componentDidMount() {
    this.fetchSubjects();
  }

  componentDidUpdate(prevProps) {
    if (prevProps.interval === this.props.interval) {
      return;
    }

    this.fetchSubjects();
  }

  render() {
    if (this.state.loading) {
      return (
        <div className="subject-visual-loading">
          <Loading/>
        </div>
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
        interval = {this.props.interval}
        subjects = {this.state.subjects}/>
    );
  }
}

class SubjectSwimLane extends React.Component {

  constructor(props) {
    super(props);

    this.svgId = 'subject-visual-component-svg';

    // This binding is necessary to make `this` work in the callback
    this.handleClick = this.handleClick.bind(this);
  }

  componentDidMount() {
    this.renderSwimlanes(this.props);
  }

  componentDidUpdate(prevProps) {
    if (this.props.interval !== prevProps.interval) {
      this.renderSwimlanes(this.props);
    }
  }

  addSubjectToLane(lanes, subject) {
    let laneId = 0;
    if (lanes.length === 0) {
      lanes[laneId] = [];
    }

    const buffer = Math.abs(0.1 * Math.max(subject.limitFrom, subject.limitTo));
    //
    // Find the index of a lane where the subject does not overlap
    //
    for (laneId = 0; laneId < lanes.length; laneId++) {
      const lane = lanes[laneId];
      let overlaps = false;

      for (let i = 0; i < lane.length; i++) {
        let s = lane[i];

        const bufferedFrom = subject.limitFrom - buffer;
        const bufferedTo = subject.limitTo + buffer;

        if (bufferedTo > s.limitFrom && bufferedFrom <= s.limitTo) {
          // where subject.limitTo falls within s.range
          overlaps = true;
          break;
        }

        if (bufferedFrom >= s.limitFrom && bufferedFrom < s.limitTo) {
          // where subject.limitFrom falls within s.range
          overlaps = true;
          break;
        }

        if (bufferedFrom <= s.limitFrom && bufferedTo >= s.limitTo) {
          // where subject.range is wider than s.range
          overlaps = true;
          break;
        }
      }

      if (! overlaps) {
        break; // Can use this lane due to no overlap
      }
    }

    //
    // If laneId identified a lane with no overlap then
    // a lane will already exist. Otherwise, a lane will
    // not yet exist so create it.
    //
    if (!lanes[laneId]) {
      lanes[laneId] = [];
    }

    //
    // Add the subject to the lane
    //
    lanes[laneId].push(subject);
  }

  chartify(interval, rawSubjects) {

    //
    // Base object to return results
    //
    const chartData = {
      headers: [],
      lanes: [],
      subjects: []
    };

    // let laneId = 0;
    const headerMap = new Map();

    const subjects = [...rawSubjects]
      .sort((a, b) => {
        return a.from - b.from;
      })
      .forEach((subject, i) => {
        //
        // Preserve original datum for export from component
        //
        subject.current = Object.assign({}, subject);

        //
        // Limit subject from to value of interval from
        //
        subject.limitFrom = (subject.from < interval.from) ? interval.from : subject.from;

        //
        // Limit subject to to value of interval to
        //
        subject.limitTo = (subject.to > interval.to) ? interval.to : subject.to;

        const laneKind = subject.kind;
        //
        // Create a lane if not already exists
        //
        let lanes = headerMap.get(laneKind);
        if (! lanes) {
          lanes = [];
          headerMap.set(laneKind, lanes);
        }

        this.addSubjectToLane(lanes, subject);
      });

    //
    // Iterate back through the header map to flatten
    // the lanes for adding into chartdata
    //
    headerMap.forEach((lanes, header) => {
      let headerStartsIdx = 0;

      for (let i = 0; i < lanes.length; i++) {
        const lane = lanes[i];

        const laneId = chartData.lanes.length;
        if (i === 0) {
          // Identify the first lane of the header group
          headerStartsIdx = laneId;
        }

        for (let j = 0; j < lane.length; j++) {
          const subject = lane[j];
          subject.laneId = laneId;
          subject.headerId = chartData.headers.length;
          chartData.subjects.push(subject);
        }

        chartData.lanes.push({
          id: laneId,
          headerId: chartData.headers.length,
          headerLane: (headerStartsIdx === laneId),
          subjects: lane.length
        });
      }

      chartData.headers.push({
        name: header,
        lanes: lanes.length,
        headerStartsIdx: headerStartsIdx
      });
    });

    return chartData;
  }

  //
  // Click function for selection
  //
  handleClick(event, d) {
    if (!d) {
      return;
    }

    this.selected = d;
    this.props.onSelectedSubjectChange(this.selected.current);
  }

  //
  // Calculate the X co-ordinate of the subject's timeline bar
  // using the passed-in xScale that governs the conversion
  // from actual year to point on the x-scale.
  // This takes into account subjects whose from date is lower
  // than tha minimum of the scale's domain (inc. nice()) hence
  // ensures the bar is pinned accordinly.
  //
  calcX(subject, xScale) {
    const min = xScale.domain()[0];
    const x1 = subject.from < min ? min : subject.limitFrom;

    return d3Format(".1f")(xScale(x1));
  }

  //
  // calculate height from y co-ordinates of this subject(n) & subject(n+1)
  //
  calcHeight(subject, yScale) {
    const m1 = d3Format(".1f")((yScale(subject.laneId)) + 3);
    const m2 = d3Format(".1f")((yScale(subject.laneId + 1)) - 2);
    return m2 - m1;
  }

  //
  // Calculate the width of the subject's timeline bar
  // using the passed-in xScale that governs the conversion
  // from actual year to point on the x-scale.
  // This takes into account subjects whose range exceeds the
  // minimum and/or maximum of the scale's domain hence ensures
  // the bar is pinned accordingly.
  //
  calcWidth(subject, xScale) {

    const min = xScale.domain()[0];
    const max = xScale.domain()[1];

    const x1 = subject.from < min ? min : subject.limitFrom;
    const x2 = subject.to > max ? max : subject.limitTo;

    const w = d3Format(".1f")(xScale(x2)) - d3Format(".1f")(xScale(x1));
    return w < 1 ? 1 : w; // Have a minimum of 1 so at least something is visible
  }

  //
  // Renders the swimlanes once the data has been
  // successfully retrieved from the database
  //
  renderSwimlanes(props) {
    if (! props.interval) {
      return;
    }

    const parentDiv = d3Select('.subject-visual');
    if (!parentDiv || !parentDiv.node()) {
      return;
    }

    const boundingRect = parentDiv.node().getBoundingClientRect();
    const margin = {top: 20, right: 30, bottom: 15, left: 80};
    const svgWidth = boundingRect.width - 80;
    const svgHeight = boundingRect.height - 80;

    //
    // Select the existing svg created by the initial render
    //
    this.svg = d3Select('#' + this.svgId);
    this.svg
      .attr('viewBox', "0 0 " + svgWidth + " " + svgHeight);

    this.width = svgWidth - margin.left - margin.right;
    this.height = svgHeight - margin.top - margin.bottom;
    this.minDuration = parseFloat(this.width * 0.005);

    this.chartData = this.chartify(props.interval, props.subjects);

    const laneHeight  = svgHeight / (this.chartData.lanes.length)
    const subjectColorCycle = d3ScaleOrdinal(d3SchemeCategory10);
    const laneColorCycle = d3ScaleOrdinal(d3SchemePastel1);

    // this.svg.append('defs')
    //   .append('clipPath')
	  //   .attr('id', 'clip')
	  //   .append('rect')
		//   .attr('width', margin.left + this.width + margin.right)
		//   .attr('height', margin.top + this.height + margin.bottom);

    this.gchart = this.svg.append("g")
      .attr('transform', "translate(" + margin.left + "," + margin.top + ")")
      .attr('class', "subject-container")
      .attr('width', this.width)
	    .attr('height', this.height);

    const xScale = d3ScaleLinear()
      .domain([props.interval.from, props.interval.to]).nice()
      .range([0, this.width]);

    const yExt = d3Extent(this.chartData.lanes, d => d.id);
    const yScale = d3ScaleLinear()
      .domain([yExt[0], yExt[1] + 1])
      .range([0, this.height]);

    // draw the x axis
    const xDateAxis = d3AxisTop(xScale)
	    .tickFormat(d => common.displayYear(d));

    this.gchart.append('g')
     .attr("class", "axis")
     .call(xDateAxis);

    // draw the lanes for the chart
    this.gchart.append('g')
      .selectAll('.laneLines')
      .data(this.chartData.lanes)
      .enter()
      .append('line')
      .attr('x1', 0)
      .attr('y1', d => d3Format(".1f")((yScale(d.id)) + 0.5))
      .attr('x2', this.width)
      .attr('y2', d => d3Format(".1f")((yScale(d.id)) + 0.5))
      .attr('stroke', d => d.headerLane ? 'black' : 'lightgray');

    // draw the lane text
    this.gchart.append('g')
      .selectAll('.laneText')
      .data(this.chartData.headers)
      .enter().append('text')
      .text(d => d.name)
      .attr('text-anchor', 'end')
      .attr('class', 'laneText')
      .attr('x', -10)
      .attr('y', d => {
        const y1 = d3Format(".1f")((yScale(d.headerStartsIdx)) + 0.5);
        const yn = d3Format(".1f")((yScale(d.headerStartsIdx + (d.lanes / 2))) + 0.5);
        const fontHeight = 5;

        return parseFloat(yn) + fontHeight;
      });

    // Paint the backgrounds of the lanes
    this.gchart.append('g')
      .selectAll('.laneBackground')
      .data(this.chartData.headers)
      .enter().append('rect')
      .attr('class', 'laneBackground')
      .attr('x', 0)
      .attr('y', d => d3Format(".1f")((yScale(d.headerStartsIdx)) + 0.5))
      .attr('width', this.width)
      .attr('height', d => {
        const y1 = d3Format(".1f")((yScale(d.headerStartsIdx)) + 0.5);
        const yn = d3Format(".1f")((yScale(d.headerStartsIdx + d.lanes)) + 0.5);
        return yn - y1;
      })
      .attr('fill', d => laneColorCycle(d.name))
      .attr('fill-opacity', 0.3);

    // Add the data items
    this.subjectItems = this.gchart.append('g')
      .selectAll('.subjects')
      .data(this.chartData.subjects)
      .enter()
      .append('rect')
      .attr('id', d => "subject-" + d._id)
      .attr('x', d => this.calcX(d, xScale))
      .attr('y', d => d3Format(".1f")((yScale(d.laneId)) + 3))
      .attr('width', d => this.calcWidth(d, xScale))
      .attr('height', d => this.calcHeight(d, yScale))
      .style('fill', d => subjectColorCycle(d.category))
      .on("click", this.handleClick)
      .on("mouseover", (event, datum) => {
        const d = d3Select("#" + event.target.id);
        if (d) {
          d.classed('subject-hover', true);
        }
      })
      .on("mouseout", (event, datum) => {
        const d = d3Select("#" + event.target.id);
        if (d) {
          d.classed('subject-hover', false);
        }
      });

    // Add the data text labels
    this.subjectItems.append("title")
      .text(d => d.name + "\n" + common.displayYear(d.from) + "  to  " + common.displayYear(d.to));
  }

  render() {
    if (! this.props.interval) {
      return (
        <div className="subject-visual-component"/>
      )
    }

    if (! this.props.subjects || this.props.subjects.length === 0) {
      return (
        <div className="subject-visual-component">
          <div className="subject-visual-nocontent">
            <p>No content available for the {this.props.interval.name} {this.props.interval.kind}</p>
          </div>
        </div>
      )
    }

    return (
      <div className="subject-visual-component">
        <svg
          id = { this.svgId }
          preserveAspectRatio="xMidYMid meet"
        />
      </div>
    )
  }
}
