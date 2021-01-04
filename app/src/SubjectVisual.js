import React from 'react';
import {axisTop as d3AxisTop} from 'd3-axis';
import {extent as d3Extent} from 'd3-array';
import {format as d3Format} from 'd3-format';
import {
  scaleOrdinal as d3ScaleOrdinal,
  scaleLinear as d3ScaleLinear } from 'd3-scale';
import {color as d3Color} from 'd3-color';
import {
  select as d3Select} from 'd3-selection';
import 'font-awesome/css/font-awesome.min.css';
import Loading from './loading/Loading.js';
import ErrorMsg from './ErrorMsg.js';
import SubjectVisualLegend from './SubjectVisualLegend.js';
import * as api from './api';
import * as common from './common';
import './SubjectVisual.scss';

export default class SubjectVisual extends React.Component {

  constructor(props) {
    super(props);

    this.state = { loading: true };

    this.handleResize = this.handleResize.bind(this);
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

  //
  // Fetch all the categories from the backend service
  // This needs to be done once then retained and passed to the subject Swimlane component
  //
  fetchCategories() {
    api.subjectCategories()
      .then((res) => {
        if (!res.data || res.data.length === 0) {
          this.logErrorState("Failed to fetch categories be fetched", new Error("Response data payload was empty."));
        } else {
          this.setState({
            allCategories: res.data
          })
        }
      }).catch((err) => {
        this.logErrorState("Failed to fetch interval data", err);
      });
  }

  addSubjectToLane(lanes, subject) {
    let laneId = 0;
    if (lanes.length === 0) {
      lanes[laneId] = {
        category: subject.category,
        subjects: []
      }
    }

    const buffer = Math.abs(0.01 * Math.max(subject.limitFrom, subject.limitTo));
    //
    // Find the index of a lane where the subject does not overlap
    //
    for (laneId = 0; laneId < lanes.length; laneId++) {
      const lane = lanes[laneId];
      const laneCategory = lane.category;
      const laneSubjects = lane.subjects;

      let overlaps = false;

      if (laneCategory !== subject.category) {
        continue;
      }

      for (let i = 0; i < laneSubjects.length; i++) {
        let s = laneSubjects[i];

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
      lanes[laneId] = {
        category: subject.category,
        subjects: []
      }
    }

    //
    // Add the subject to the lane
    //
    lanes[laneId].subjects.push(subject);
  }

  chartify(interval, subjects) {
    //
    // Base object to return results
    //
    const chartData = {
      headers: [],
      lanes: [],
      subjects: [],
      categories: []
    };

    const headerMap = new Map();
    const categorySet = new Set();

    subjects
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

      categorySet.add(subject.category);
    });

    chartData.categories = Array.from(categorySet);

    //
    // Sort the headers alphabetically
    //
    const headerKeys = Array.from(headerMap.keys()).sort();

    //
    // Iterate back through the header map to flatten
    // the lanes for adding into chartdata
    //
    for (const header of headerKeys.values()) {
      //
      // Sort the lanes to ensure all those in same category are together
      //
      const lanes = headerMap.get(header).sort((a, b) => {
        return a.category.localeCompare(b.category);
      });
      let headerStartsIdx = 0;

      for (let i = 0; i < lanes.length; i++) {
        const lane = lanes[i];

        const laneId = chartData.lanes.length;
        if (i === 0) {
          // Identify the first lane of the header group
          headerStartsIdx = laneId;
        }

        for (let j = 0; j < lane.subjects.length; j++) {
          const subject = lane.subjects[j];
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
    }

    return chartData;
  }

  fetchSubjects() {
    this.setState({
      loading: true,
      errorMsg: "",
      error: null,
    })

    if (! this.props.interval) {
      this.setState({
        loading: false,
        data: undefined
      })
      return;
    }

    //
    // Fetch the subject data from the backend service
    //
    api.subjectsWithin(this.props.interval.from, this.props.interval.to)
      .then((res) => {
        if (!res.data || res.data.length === 0) {
          this.setState({
            loading: false,
            data: undefined
          })
        } else {

          const subjects = res.data;
          const data = this.chartify(this.props.interval, subjects);

          this.setState({
            loading: false,
            data: data
          })
        }
      }).catch((err) => {
        this.logErrorState("Failed to fetch interval data", err);
      });
  }

  dimensions() {
    if (!this.props.parent || !this.props.parent.current) {
      return;
    }

    const boundingRect = this.props.parent.current.getBoundingClientRect();
    const width = boundingRect.width;
    const height = boundingRect.height;

    this.setState({
      width: width,
      height: height
    });
  }

  handleResize() {
    this.dimensions();
  }

  componentDidMount() {
    this.dimensions();
    this.fetchCategories();
    this.fetchSubjects();
    window.addEventListener('resize', this.handleResize);
  }

  componentWillUnmount() {
    window.removeEventListener("resize", this.handleResize);
  }

  componentDidUpdate(prevProps) {
    if (prevProps.interval === this.props.interval) {
      return;
    }

    this.dimensions();
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
        width = {this.state.width}
        height = {this.state.height}
        onSelectedSubjectChange = {this.props.onSelectedSubjectChange}
        interval = {this.props.interval}
        subject = {this.props.subject}
        allCategories = {this.state.allCategories}
        data = {this.state.data}
        />
    );
  }
}

class SubjectSwimLane extends React.Component {

  constructor(props) {
    super(props);

    this.svgId = 'subject-visual-component-svg';
    this.margins = { top: 30, right: 30, bottom: 15, left: 80 };
    this.state = {
      legendVisible: false
    };

    // This binding is necessary to make `this` work in the callback
    this.handleLegendClick = this.handleLegendClick.bind(this);
    this.toggleLegend = this.toggleLegend.bind(this);
    this.handleVisualClick = this.handleVisualClick.bind(this);
  }

  componentDidMount() {
    this.renderSwimlanes();
  }

  componentDidUpdate(prevProps) {
    if (this.props.subject && this.props.subject.owner === this.svgId) {
      // We called for this update with our own clicks so no need to update
      return;
    }

    if (prevProps.subject === this.props.subject &&
       prevProps.interval === this.props.interval &&
       prevProps.width === this.props.width &&
       prevProps.height === this.props.height) {
      return;
    }

    this.renderSwimlanes();
  }

  handleLegendClick(event) {
    this.toggleLegend();
    event.stopPropagation();
  }

  toggleLegend() {
    this.setState({
      legendVisible: !this.state.legendVisible
    });
  }

  displaySelectionOutline(node, select) {
    if (!node) {
      return;
    }

    const id = '#subject-' + common.identifier(node._id);
    d3Select(id).classed('subject-outline-hover', false);
    d3Select(id).classed('subject-outline-clicked', select);
  }

  //
  // Click function for selection
  //
  handleVisualClick(event, d) {
    if (!d) {
      return;
    }

    this.displaySelectionOutline(this.selected, false);
    this.selected = d;

    this.displaySelectionOutline(this.selected, true);

    //
    // Tag the data with this as the owner
    //
    this.selected.current.owner = this.svgId;
    this.props.onSelectedSubjectChange(this.selected.current);
  }

  //
  // Calculate the X co-ordinate of the subject's timeline bar
  // using the passed-in xScale that governs the conversion
  // from actual year to point on the x-scale.
  // This takes into account subjects whose from date is lower
  // than the minimum of the scale's domain (inc. nice()) hence
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
    return w < 5 ? 5 : w; // Have a minimum of 5 so at least something is visible
  }

  //
  // Walk the subjects and select the chosen subject
  //
  traverseToSubject(subject) {
    if (! subject) {
      return;
    }

    //
    // Find the actual subject in our hierarchy
    //
    let visSubject = null;
    for (const s of this.props.data.subjects.values()) {
      if (s._id === this.props.subject._id) {
        visSubject = s; // Found it!
        break;
      }
    }

    if (! visSubject) {
      //
      // Possible that subject is out-of-date and not in this visual
      // so don't try and click, just quietly ignore. If we reset in
      // App when interval is changed then race condition occurs that
      // stop descriptions being shown from navigation
      //
      return;
    }

    this.handleVisualClick(null, visSubject);
  }

  //
  // Create gradient definitions
  //
  generateGradient(defsElement, names, colorCycle) {
    for (const name of names.values()) {
      const g = defsElement.append("radialGradient")
        .attr("id", "gradient-" + common.identifier(name))
        .attr("cx", "50%")
        .attr("cy", "50%")
        .attr("r", "85%");

      g.append("stop")
        .attr("offset", "0%")
        .attr("stop-color", d3Color(colorCycle(name)).brighter().brighter());

      g.append("stop")
        .attr("offset", "90%")
        .attr("stop-color", colorCycle(name));
    }
  }

  createIntervalBounds(parent, from, to, xScale, yScale, yMax) {

    const min = xScale.domain()[0];
    const max = xScale.domain()[1];

    const fromX = d3Format(".1f")(xScale(from));
    const toX = d3Format(".1f")(xScale(to));
    const minX = d3Format(".1f")(xScale(min));
    const maxX = d3Format(".1f")(xScale(max));
    const maxY = d3Format(".1f")(yScale(yMax));

    const lowerGroup = parent.append('g')
      .attr('id', 'lower-interval-bounds');

    lowerGroup.append('line')
      .attr('x1', fromX).attr('y1', 0)
      .attr('x2', fromX).attr('y2', maxY)
      .attr('stroke', 'black')
      .attr('stroke-width', 2)
      .attr('stroke-dasharray', '5,5');

    lowerGroup.append('rect')
      .attr('x', 0).attr('y', 0)
      .attr('width', (fromX - minX)).attr('height', maxY)
      .attr('fill', 'darkgray')
      .attr('fill-opacity', 0.5);

    const upperGroup = parent.append('g')
      .attr('id', 'upper-interval-bounds');

    upperGroup.append('line')
      .attr('x1', toX).attr('y1', 0)
      .attr('x2', toX).attr('y2', maxY)
      .attr('stroke', 'black')
      .attr('stroke-width', 2)
      .attr('stroke-dasharray', '5,5');

    lowerGroup.append('rect')
      .attr('x', toX).attr('y', 0)
      .attr('width', (maxX - toX)).attr('height', maxY)
      .attr('fill', 'darkgray')
      .attr('fill-opacity', 0.3);
  }

  //
  // Renders the swimlanes once the data has been
  // successfully retrieved from the database
  //
  renderSwimlanes() {
    if (! this.props.data || ! this.props.interval || ! this.props.allCategories) {
      return;
    }

    this.innerWidth = this.props.width - this.margins.left - this.margins.right;
    this.innerHeight = this.props.height - this.margins.top - this.margins.bottom;

    const subjectColorCycle = d3ScaleOrdinal()
      .domain(this.props.allCategories)
      .range(common.calcCategoryColours(this.props.allCategories));

    const headerNames = [];
    for (const h of this.props.data.headers) {
      headerNames.push(h.name);
    }
    const laneColorCycle = d3ScaleOrdinal()
      .domain(headerNames)
      .range(common.calcKindColours(headerNames));

    this.svg = d3Select('#' + this.svgId);

    // Remove all defs & subject-containers on refresh
    this.svg.selectAll('defs').remove();
    this.svg.selectAll('.subject-container').remove();

    const defs = this.svg.append("defs");

    this.generateGradient(defs, this.props.data.categories, subjectColorCycle);
    this.generateGradient(defs, headerNames, laneColorCycle);

    this.gchart = this.svg
      .append('g')
      .attr("class", "subject-container")
      .attr('transform', "translate(" + this.margins.left + "," + this.margins.top + ")")
      .attr('width', this.innerWidth)
	    .attr('height', this.innerHeight);

    const xScale = d3ScaleLinear()
      .domain([this.props.interval.from, this.props.interval.to]).nice()
      .range([0, this.innerWidth]);

    const yExt = d3Extent(this.props.data.lanes, d => d.id);

    //
    // Restrict the height of the lanes to a maximum of a 1/3 of the height
    // since the bars being too wide look odd. We calculate the height of
    // a lane then compare it to a 1/3 of the height. If wider then then, the
    // maximum range is designated a 1/3 of the height.
    //
    const laneHeight = this.innerHeight / this.props.data.lanes.length;
    const maxLaneHeight = (this.innerHeight / 3);
    const upperRange = laneHeight > maxLaneHeight ? maxLaneHeight : this.innerHeight;
    const yScale = d3ScaleLinear()
      .domain([yExt[0], yExt[1] + 1])
      .range([0, upperRange]);


    // draw the x axis
    const xDateAxis = d3AxisTop(xScale)
	    .tickFormat(d => common.displayYear(d));

    this.gchart.append('g')
     .attr("class", "axis")
     .call(xDateAxis);

    // draw the lanes for the chart
    this.gchart.append('g')
      .selectAll('.laneLines')
      .data(this.props.data.lanes)
      .enter()
      .append('line')
      .attr('x1', 0)
      .attr('y1', d => d3Format(".1f")((yScale(d.id)) + 0.5))
      .attr('x2', this.innerWidth)
      .attr('y2', d => d3Format(".1f")((yScale(d.id)) + 0.5))
      .attr('stroke', d => d.headerLane ? 'black' : 'lightgray');

    // draw the lane text
    this.gchart.append('g')
      .selectAll('.laneText')
      .data(this.props.data.headers)
      .enter().append('text')
      .text(d => d.name)
      .attr('text-anchor', 'end')
      .classed('laneText', true)
      .attr('x', -10)
      .attr('y', d => {
        const yn = d3Format(".1f")((yScale(d.headerStartsIdx + (d.lanes / 2))) + 0.5);
        const fontHeight = 6;

        return parseFloat(yn) + fontHeight;
      });

    // Paint the backgrounds of the lanes
    this.gchart.append('g')
      .selectAll('.laneBackground')
      .data(this.props.data.headers)
      .enter().append('rect')
      .classed('laneBackground', true)
      .attr('x', 0)
      .attr('y', d => d3Format(".1f")((yScale(d.headerStartsIdx)) + 0.5))
      .attr('width', this.innerWidth)
      .attr('height', d => {
        const y1 = d3Format(".1f")((yScale(d.headerStartsIdx)) + 0.5);
        const yn = d3Format(".1f")((yScale(d.headerStartsIdx + d.lanes)) + 0.5);
        return yn - y1;
      })
      .attr('fill', d => "url(#gradient-" + common.identifier(d.name) + ")")
      .attr('fill-opacity', 0.3);

    // Add the data items
    this.subjectItems = this.gchart.append('g')
      .selectAll('.subjects')
      .data(this.props.data.subjects)
      .enter()
      .append('rect')
      .attr('id', d => "subject-" + common.identifier(d._id))
      .attr('x', d => this.calcX(d, xScale))
      .attr('y', d => d3Format(".1f")((yScale(d.laneId)) + 3))
      .attr('width', d => this.calcWidth(d, xScale))
      .attr('height', d => this.calcHeight(d, yScale))
      .attr('rx', "5")
      .attr("fill", d => {
        const w = this.calcWidth(d, xScale);
        return (w <= 5) ? subjectColorCycle(d.category) : "url(#gradient-" + common.identifier(d.category) + ")";
      })
      .on("click", this.handleVisualClick)
      .on("mouseover", (event, datum) => {
        const d = d3Select("#" + common.identifier(event.target.id));
        if (d) {
          d.classed('subject-outline-hover', true);
        }
      })
      .on("mouseout", (event, datum) => {
        const d = d3Select("#" + common.identifier(event.target.id));
        if (d) {
          d.classed('subject-outline-hover', this.selected === datum);
        }
      });

    // Add the data text labels
    this.subjectItems.append("title")
      .text(d => d.name + "\n" + common.displayYear(d.from) + "  to  " + common.displayYear(d.to));

    //
    // draw the lower and upper demarcation boundaries
    //
    this.createIntervalBounds(this.gchart,
      this.props.interval.from,
      this.props.interval.to,
      xScale, yScale, this.props.data.lanes.length);

    //
    // After complete rendering if a subject
    // has been assigned then traverse to it
    //
    this.traverseToSubject(this.props.subject);
  }

  render() {
    if (! this.props.interval) {
      return (
        <div className="subject-visual-component"/>
      )
    }

    if (! this.props.data || this.props.data.subjects.length === 0) {
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
        <div className="subject-visual-button">
          <button id="subject-visual-legend-btn" className="fa fa-bars" onClick={this.handleLegendClick}/>
        </div>
        <SubjectVisualLegend
          width = { this.props.width }
          height = { this.props.height }
          visible = { this.state.legendVisible }
          onToggleLegend = {this.toggleLegend}
          categories = { this.props.data.categories }
        />
        <svg
          id = { this.svgId }
          width = { this.props.width * 0.9 }
          height = { this.props.height * 0.9 }
          viewBox = { "0 0 " + this.props.width + " " + this.props.height }
          preserveAspectRatio="xMidYMid slice"
        />
      </div>
    )
  }
}
