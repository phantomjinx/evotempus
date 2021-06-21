import React from 'react';
import {axisTop as d3AxisTop} from 'd3-axis';
import {
  extent as d3Extent,
  max as d3Max,
  min as d3Min
} from 'd3-array';
import {format as d3Format} from 'd3-format';
import {
  scaleOrdinal as d3ScaleOrdinal,
  scaleLinear as d3ScaleLinear
} from 'd3-scale';
import {color as d3Color} from 'd3-color';
import {zoom as d3Zoom} from 'd3-zoom';
import {select as d3Select} from 'd3-selection';
import {interpolateRound as d3InterpolateRound} from 'd3-interpolate';
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

  chartify(interval, subjects, dataCategories) {
    //
    // Base object to return results
    //
    const chartData = {
      headers: [],
      lanes: [],
      subjects: [],
      categoryNames: []
    };

    const headerMap = new Map();
    const categorySet = new Set();

    subjects
    .sort((a, b) => {
      return a.from - b.from;
    })
    .forEach((subject, i) => {

      const subjCategory = dataCategories.find(category => {
        return category.name === subject.category;
      });

      //
      // Add the category whether filtered or not so
      // the legend can list it
      //
      categorySet.add(subjCategory.name);

      //
      // Do we consider the subject
      //
      if (subjCategory.filtered === true) {
        return;
      }

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

    chartData.categoryNames = Array.from(categorySet);

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
          const data = this.chartify(this.props.interval, subjects, this.props.categories);

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
    this.fetchSubjects();
    window.addEventListener('resize', this.handleResize);
  }

  componentWillUnmount() {
    window.removeEventListener("resize", this.handleResize);
  }

  componentDidUpdate(prevProps) {
    if (prevProps.interval === this.props.interval &&
        prevProps.categories === this.props.categories) {
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
        onSelectedIntervalChange = {this.props.onSelectedIntervalChange}
        onUpdateCategoryFilter = {this.props.onUpdateCategoryFilter}
        onUpdateLegendVisible = {this.props.onUpdateLegendVisible}
        interval = {this.props.interval}
        subject = {this.props.subject}
        categories = {this.props.categories}
        legendVisible = {this.props.legendVisible}
        data = {this.state.data}
        />
    );
  }
}

class SubjectSwimLane extends React.Component {

  constructor(props) {
    super(props);

    this.svgId = 'subject-visual-component-svg';
    this.zoomSystem = {
      viewPort: 5,
      innerWidth: 0,
      innerHeight: 0,
      scale: 1
    };
    this.margins = { top: 0, right: 0, bottom: 0, left: 0 };

    // This binding is necessary to make `this` work in the callback
    this.handleLegendClick = this.handleLegendClick.bind(this);
    this.toggleLegend = this.toggleLegend.bind(this);
    this.categoryNames = this.categoryNames.bind(this);
    this.resetCategories = this.resetCategories.bind(this);
    this.handleVisualClick = this.handleVisualClick.bind(this);
    this.handleVisualDoubleClick = this.handleVisualDoubleClick.bind(this);

    this.clickTimer = 0;
    this.clickDelay = 200;
    this.clickPrevent = false;
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

       //
       // Check legend visible state (done in renderSwimlanes())
       // if a change had occurred.
       //
       if (prevProps.legendVisible !== this.props.legendVisible) {
         this.setState({
           legendVisible: this.props.legendVisible
         })
       };

      return;
    }

    this.renderSwimlanes();
  }

  //
  // Click function for selection
  //
  handleVisualClick(event, d) {
    //
    // Put inside timer to allow for double-click
    // event to determine if it should be fired
    //
    this.clickTimer = setTimeout(() => {
      if (this.clickPrevent) {
        this.clickPrevent = false;
        return;
      }

      if (!d) {
        return;
      }

      if (this.selected === d) {
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
    }, this.clickDelay);
  }

  handleVisualDoubleClick(event, d) {
    //
    // Prevent the single click firing when
    // the user actually double-clicked. Stops
    // needless updates out of the component
    //
    clearTimeout(this.clickTimer);
    this.clickPrevent = true;

    if (event) {
      event.preventDefault();
    }

    if (!d) {
      return;
    }

    api.intervalEncloses(d.from, d.to)
      .then((res) => {
        if (!res.data || res.data.length === 0) {
          this.setState({
            msg : "Error: Cannot navigate to a direct parent interval of the subject"
          })
        } else {
          //
          // Selected the returned interval
          //
          this.props.onSelectedIntervalChange(res.data[0]);
          this.props.onSelectedSubjectChange(d);
        }
      }).catch((err) => {
        this.setState({
          msg: "An error occurred whilst trying to navigate to subject",
          msgClass: "search-msg-error",
          error: err
        })
      });
  }

  handleLegendClick(event) {
    this.toggleLegend();
    event.stopPropagation();
  }

  toggleLegend() {
    this.props.onUpdateLegendVisible(!this.props.legendVisible);
  }

  //
  // Get an array of category names from the
  // array of category objects
  //
  categoryNames() {
    let names = [];
    this.props.categories.forEach(category => {
      names.push(category.name);
    });

    return names;
  }

  //
  // Reset all categories back to visible
  //
  resetCategories(event) {
    this.props.onUpdateCategoryFilter(this.categoryNames(), false);

    if (event) {
      event.preventDefault();
    }
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
  // Adds a selection outline to the given node
  //
  displaySelectionOutline(node, select) {
    if (!node) {
      return;
    }

    const id = '#subject-' + common.identifier(node._id);
    d3Select(id).classed('subject-outline-hover', false);
    d3Select(id).classed('subject-outline-clicked', select);
  }

  //
  // Calculate the X co-ordinate of the subject's timeline bar
  // using the passed-in xScale that governs the conversion
  // from actual year to point on the x-scale.
  // This takes into account subjects whose from date is lower
  // than the minimum of the scale's domain (inc. nice()) hence
  // ensures the bar is pinned accordinly.
  //
  calcSubjectX(subject, xScale) {
    const min = xScale.domain()[0];

    const x1 = subject.from < min ? min : subject.from;
    return parseFloat(xScale(x1));
  }

  //
  // calculate height from y co-ordinates of this subject(n) & subject(n+1)
  //
  calcSubjectHeight(subject, yScale) {
    const m1 = parseFloat(yScale(subject.laneId) + 3);
    const m2 = parseFloat(yScale(subject.laneId + 1) - 2);
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
  calcSubjectWidth(subject, xScale) {

    const min = xScale.domain()[0];
    const max = xScale.domain()[1];

    const x1 = subject.from < min ? min : subject.from;
    const x2 = subject.to > max ? max : subject.to;

    const w = parseFloat(xScale(x2)) - parseFloat(xScale(x1));
    return w < 5 ? 5 : w; // Have a minimum of 5 so at least something is visible
  }


  //
  // Create gradient definitions
  //
  createGradient(defsElement, names, colorCycle) {
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

  //
  // Create the bounding blocks of the interval limits
  //
  createIntervalBounds(parent) {

    const lowerGroup = parent.append('g')
      .attr('id', 'lower-interval-bounds')
      .attr('clip-path', 'url(#data-clip)');

    lowerGroup.append('line')
      .classed('lowerIntervalBoundLine', true)
      .attr('stroke', 'black')
      .attr('stroke-width', 2)
      .attr('stroke-dasharray', '5,5')
      .attr("transform", this.marginTranslation());

    lowerGroup.append('rect')
      .classed('lowerIntervalBoundBlock', true)
      .attr('fill', 'darkgray')
      .attr('fill-opacity', 0.3)
      .attr("transform", this.marginTranslation());

    const upperGroup = parent.append('g')
      .attr('id', 'upper-interval-bounds')
      .attr('clip-path', 'url(#data-clip)');

    upperGroup.append('line')
      .classed('upperIntervalBoundLine', true)
      .attr('stroke', 'black')
      .attr('stroke-width', 2)
      .attr('stroke-dasharray', '5,5')
      .attr("transform", this.marginTranslation());

    upperGroup.append('rect')
      .classed('upperIntervalBoundBlock', true)
      .attr('fill', 'darkgray')
      .attr('fill-opacity', 0.3)
      .attr("transform", this.marginTranslation());
  }

  //
  // Position the interval limit blocks
  //
  updateIntervalBounds(parent, from, to, lanes, xScale, yScale) {
    const xsMin = xScale.domain()[0];
    const xsMax = xScale.domain()[1];
    const ysMin = d3Min(lanes, d => d.id); // domain can be smaller, due to nice()
    const ysMax = d3Max(lanes, d => d.id) + 1; // domain can be longer, due to nice()

    const fromX = parseFloat(xScale(from));
    const toX = parseFloat(xScale(to));
    const minX = parseFloat(xScale(xsMin));
    const maxX = parseFloat(xScale(xsMax));
    const minY = parseFloat(yScale(ysMin));
    const maxY = parseFloat(yScale(ysMax));

    parent.select('.lowerIntervalBoundLine')
      .attr('x1', fromX).attr('y1', minY)
      .attr('x2', fromX).attr('y2', maxY);

    parent.select('.lowerIntervalBoundBlock')
      .attr('x', minX).attr('y', minY)
      .attr('width', (fromX - minX)).attr('height', (maxY - minY));

    parent.select('.upperIntervalBoundLine')
      .attr('x1', toX).attr('y1', minY)
      .attr('x2', toX).attr('y2', maxY);

    parent.select('.upperIntervalBoundBlock')
      .attr('x', toX).attr('y', minY)
      .attr('width', (maxX - toX)).attr('height', (maxY - minY));
  }

  //
  // The translation to account for the calculated margins
  //
  marginTranslation() {
    return "translate(" + this.margins.left + "," + this.margins.top + ")";
  }

  //
  // Renders the swimlanes once the data has been
  // successfully retrieved from the database
  //
  renderSwimlanes() {
    if (! this.props.data || ! this.props.interval || ! this.props.categories) {
      return;
    }

    this.margins = {
      top: ((this.props.height / 10) * this.zoomSystem.viewPort),
      right: ((this.props.width / 20) * this.zoomSystem.viewPort),
      bottom: ((this.props.height / 20) * this.zoomSystem.viewPort),
      left: ((this.props.width / 8) * this.zoomSystem.viewPort)
    };

    this.zoomSystem.innerWidth = (this.props.width * this.zoomSystem.viewPort) - this.margins.left - this.margins.right;
    this.zoomSystem.innerHeight = (this.props.height * this.zoomSystem.viewPort) - this.margins.top - this.margins.bottom;

    let categoryNames = this.categoryNames();
    this.subjectColorCycle = d3ScaleOrdinal()
      .domain(categoryNames)
      .range(common.calcCategoryColours(categoryNames));

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

    this.createGradient(defs, this.props.data.categoryNames, this.subjectColorCycle);
    this.createGradient(defs, headerNames, laneColorCycle);

    defs.append('clipPath')
      .attr('id', 'data-clip')
      .append('rect')
      .attr('x', this.margins.left)
      .attr('y', this.margins.top)
      .attr('width', this.zoomSystem.innerWidth)
      .attr('height', this.zoomSystem.innerHeight);

    defs.append('clipPath')
      .attr('id', 'label-clip')
      .append('rect')
      .attr('x', -10)
      .attr('y', this.margins.top)
      .attr('width', this.zoomSystem.innerWidth)
      .attr('height', this.zoomSystem.innerHeight);

    this.gchart = this.svg
      .append('g')
      .attr("class", "subject-container");

    const xScale = d3ScaleLinear()
      .domain([this.props.interval.from, this.props.interval.to]).nice()
      .range([0, this.zoomSystem.innerWidth]);

    const yExt = d3Extent(this.props.data.lanes, d => d.id);

    //
    // Restrict the height of the lanes to a maximum of a 1/3 of the height
    // since the bars being too wide look odd. We calculate the height of
    // a lane then compare it to a 1/3 of the height. If wider then, the
    // maximum range is designated a 1/3 of the height.
    //
    const laneHeight = this.zoomSystem.innerHeight / this.props.data.lanes.length;
    const maxLaneHeight = (this.zoomSystem.innerHeight / 3);
    const upperRange = laneHeight > maxLaneHeight ? maxLaneHeight : this.zoomSystem.innerHeight;
    const yScale = d3ScaleLinear()
      .domain([yExt[0], yExt[1] + 1])
      .range([0, upperRange]);

    // draw the x axis
    this.xDateAxis = d3AxisTop(xScale)
      .ticks(7)
	    .tickFormat(d => common.displayYear(d));

    this.gxAxis = this.gchart.append('g')
      .attr("id", "time-axis")
      .attr("class", "axis")
      .attr("transform", this.marginTranslation())
      .call(this.xDateAxis);

    // draw the lanes for the chart
    this.gchart.append('g')
      .attr("id", "lane-lines")
      .attr('clip-path', 'url(#data-clip)')
      .selectAll('.laneLines')
      .data(this.props.data.lanes)
      .join('line')
      .classed('laneLines', true)
      .attr("transform", this.marginTranslation())
      .attr('stroke', d => d.headerLane ? 'black' : 'lightgray');

    // draw the lane text
    this.gchart.append('g')
      .attr("id", "lane-names")
      .attr('clip-path', 'url(#label-clip)')
      .selectAll('.laneText')
      .data(this.props.data.headers)
      .join('text')
      .text(d => d.name)
      .classed('laneText', true)
      .attr('text-anchor', 'end')
      .attr("transform", this.marginTranslation());

    // Paint the backgrounds of the lanes
    this.gchart.append('g')
      .attr("id", "lane-backgrounds")
      .attr('clip-path', 'url(#data-clip)')
      .selectAll('.laneBackground')
      .data(this.props.data.headers)
      .join("rect")
      .classed('laneBackground', true)
      .attr("transform", this.marginTranslation())
      .attr('fill', d => "url(#gradient-" + common.identifier(d.name) + ")")
      .attr('fill-opacity', 0.3);

    // Add the data items
    this.subjectItems = this.gchart.append('g')
      .attr("id", "subjects")
      .attr('clip-path', 'url(#data-clip)')
      .selectAll('.subjects')
      .data(this.props.data.subjects)
      .join("rect")
      .attr('id', d => "subject-" + common.identifier(d._id))
      .classed('subjects', true)
      .attr('rx', "5")
      .attr("transform", this.marginTranslation())
      .on("click", this.handleVisualClick)
      .on("dblclick", this.handleVisualDoubleClick);

    // Add the data text labels
    this.subjectItems.append("title")
      .text(d => d.name + "\n" + common.displayYear(d.from) + "  to  " + common.displayYear(d.to));

    //
    // draw the lower and upper demarcation boundaries
    //
    this.createIntervalBounds(this.gchart);

    //
    // Update the component positions
    //
    this.updateSwimlanes(xScale, yScale);

    this.svg.call(d3Zoom()
      .scaleExtent([1, 100000])
      .on("zoom", ({transform}) => {
        //
        // Adjusts the scale of the chart to allow the zoom
        //
        const ysMin = yScale(d3Min(this.props.data.lanes, d => d.id)); // domain can be smaller, due to nice()
        const ysMax = yScale(d3Max(this.props.data.lanes, d => d.id) + 1); // domain can be longer, due to nice()
        const height = ysMax - ysMin;

        if (transform.k <= this.zoomSystem.scale) {
          //
          // PAN & ZOOM OUT
          //

          if (transform.y > ysMin) {
            //
            // Stops panning the visual down the screen
            // ie. glues the top of the content to the x-axis
            //
            transform.y = ysMin;
          } else if (transform.applyY(ysMax) < ysMax) {
            //
            // Stop pannning the visual up the screen
            // ie. glues the bottom of the content to bottom of the y-axis
            //
            transform.y = transform.y + (ysMax - transform.applyY(ysMax));
          }

        }

        if (this.zoomSystem.scale !== transform.k) {
          //
          // ZOOM
          //

          // Record the zoom level to compare with future zooms/pans
          this.zoomSystem.scale = transform.k;
        }

        const zx = transform.rescaleX(xScale).interpolate(d3InterpolateRound);
        const zy = transform.rescaleY(yScale).interpolate(d3InterpolateRound);
        this.updateSwimlanes(zx, zy);
      }))
      .on("dblclick.zoom", null);

    //
    // After complete rendering if a subject
    // has been assigned then traverse to it
    //
    this.traverseToSubject(this.props.subject);

    //
    // Determine whether to re-open the legend
    //
    this.setState({
      legendVisible: this.props.legendVisible
    })
  }

  //
  // Update the positions of the swimlane components
  // dependent on the given scaling components
  //
  updateSwimlanes(xScale, yScale) {
    // Update the x axis
    this.gxAxis.call(this.xDateAxis.scale(xScale));

    // Update the subjects
    this.subjectItems
      .attr('x', d => this.calcSubjectX(d, xScale))
      .attr('y', d => parseFloat(yScale(d.laneId) + 3))
      .attr('width', d => this.calcSubjectWidth(d, xScale))
      .attr('height', d => this.calcSubjectHeight(d, yScale))
      .attr("fill", d => {
        const w = this.calcSubjectWidth(d, xScale);
        return (w <= 5) ? this.subjectColorCycle(d.category) : "url(#gradient-" + common.identifier(d.category) + ")";
      });

    // Update the lane backgrounds
    this.gchart
      .selectAll('.laneBackground')
      .attr('x', 0)
      .attr('y', d => parseFloat(yScale(d.headerStartsIdx) + 0.5))
      .attr('width', this.zoomSystem.innerWidth)
      .attr('height', d => {
        let y1 = parseFloat(yScale(d.headerStartsIdx)) + 0.5;
        let yn = parseFloat(yScale(d.headerStartsIdx + d.lanes) + 0.5);
        return yn - y1;
      });

    // Update the lane text
    this.gchart
      .selectAll('.laneText')
      .attr('x', -10)
      .attr('y', d => {
        let yn = parseFloat(yScale(d.headerStartsIdx + (d.lanes / 2))) + 0.5;
        const fontHeight = 30;
        return yn + fontHeight;
      });

    // Update the lane lines
    this.gchart
      .selectAll('.laneLines')
      .attr('x1', 10)
      .attr('y1', d => parseFloat(yScale(d.id) + 0.5))
      .attr('x2', this.zoomSystem.innerWidth)
      .attr('y2', d => parseFloat(yScale(d.id) + 0.5));

    // Update the interval boundaries
    this.updateIntervalBounds(this.gchart,
      this.props.interval.from, this.props.interval.to,
      this.props.data.lanes, xScale, yScale);
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
            <p>
              <a href="" onClick={(e) => this.resetCategories(e)}>Click</a> to reset category filters
            </p>
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
          visible = { this.props.legendVisible }
          onToggleLegend = {this.toggleLegend}
          categories = { this.props.categories }
          names = { this.props.data.categoryNames }
          onUpdateFilterCategory={this.props.onUpdateCategoryFilter}
        />
        <svg
          id = { this.svgId }
          width = { this.props.width }
          height = { this.props.height }
          viewBox = { "0 0 " + (this.props.width * this.zoomSystem.viewPort) + " " + (this.props.height * this.zoomSystem.viewPort)}
          preserveAspectRatio="xMidYMid slice"
        />
      </div>
    )
  }
}
