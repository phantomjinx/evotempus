import React from 'react';
import isEqual from "lodash.isequal";
import cloneDeep from "lodash.clonedeep";
import {axisTop as d3AxisTop} from 'd3-axis';
import {
  extent as d3Extent,
  max as d3Max,
  min as d3Min
} from 'd3-array';
import {
  scaleOrdinal as d3ScaleOrdinal,
  scaleLinear as d3ScaleLinear
} from 'd3-scale';
import {color as d3Color} from 'd3-color';
import {zoom as d3Zoom} from 'd3-zoom';
import {select as d3Select} from 'd3-selection';
import {interpolateRound as d3InterpolateRound} from 'd3-interpolate';
import Loading from './loading/Loading.js';
import ErrorMsg from './ErrorMsg.js';
import SubjectVisualLegend from './SubjectVisualLegend.js';
import * as api from './api';
import * as common from './common';
import './SubjectVisual.scss';

export default class SubjectVisual extends React.Component {

  constructor(props) {
    super(props);

    this.state = {
      loading: true,
      kindData: {}
    };

    this.handleResize = this.handleResize.bind(this);
    this.onUpdateKindPage = this.onUpdateKindPage.bind(this);
  }

  logErrorState(errorMsg, error) { consoleLog({prefix: "Error", message: errorMsg + "\nDetail: ", object: error});
    common.consoleLog("Error: " + errorMsg + "\nDetail: ");
    common.consoleLog(error);
    this.setState({
      errorMsg: errorMsg,
      error: error,
      loading: false
    });
  }

  static getDerivedStateFromError(error) {
    const errorMsg = "Error received from Subject Visual";
    common.consoleLog("Error: " + errorMsg + "\n Detail: " + error);
    return {
      errorMsg: errorMsg,
      error: error,
      loading: false
    };
  }

  componentDidCatch(error, info) {
    common.consoleLog(error);
  }

  chartify(interval, categories, kindData) {
    //
    // Base object to return results
    //
    const visualData = {
      kinds: [],
      lanes: [],
      subjects: [],
      categoryNames: []
    };

    let categorySet = new Set();

    let kindIdx = 0;
    let laneIdx = 0;

    let kindNames = [];
    for (const kind in kindData) {
      kindNames.push(kind);
    }

    // sort the kind names
    kindNames = common.sortKinds(kindNames);
    for (const kind of kindNames) {
      categorySet = new Set([...categorySet, ...kindData[kind].categories]);

      let page = [];
      if (kindData[kind].pages.length > 0) {
        page = kindData[kind].pages[0];
      } else {
        // Give page 1 arbitrary empty lane
        page.push([]);
      }

      //
      // Avoid losing the divisions between the kinds
      // by padding with a couple of blank lanes either side
      //
      if (page[0].length > 0) {
        page.unshift([]);
      }

      if (page[page.length - 1].length > 0) {
        page.push([]);
      }

      let kindLaneIdx = 0;
      for (const lane of page) {
        lane.id = laneIdx;
        lane.kindId = kindIdx;
        lane.kindLane = (kindLaneIdx === 0); // Identify the first lane of the kind group
        lane.count = lane.length;
        visualData.lanes.push(lane);

        for (const subject of lane) {
          subject.laneId = laneIdx;
          subject.kindId = kindIdx;

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

          visualData.subjects.push(subject);
        }

        kindLaneIdx++;
        laneIdx++;
      }

      visualData.kinds.push({
        name: kind,
        lanes: page.length,
        laneStartIdx: (laneIdx - page.length),
        page: kindData[kind].page,
        pages: kindData[kind].count,
      });

      kindIdx++;
    }

    visualData.categoryNames = Array.from(categorySet);
    return visualData;
  }

  fetchSubjects(criteria) {
    common.consoleLog("fetchSubjects - criteria ---->");
    common.consoleLog(criteria);

    this.setState({
      loading: true,
      errorMsg: "",
      error: null,
    })

    if (! criteria.interval) {
      this.setState({
        loading: false,
        kindData: {}
      });
      return;
    }

    const subjectId = criteria.subject ? criteria.subject._id : null;

    const filtered = criteria.categories
      .filter(category => {
        return category.filtered;
      })
      .map(category => {
        return category.name;
      });

    common.consoleLog("Filtered Categories");
    common.consoleLog(filtered);
    //
    // Fetch the subject data from the backend service
    //
    api.subjectsWithin(criteria.interval.from, criteria.interval.to,
                       criteria.kind, criteria.page, subjectId, filtered)
      .then((res) => {
        let newKindData = {};
        if (!res.data || res.data.length === 0) {
          if (criteria.kind) {
            // Only remove the data relevant to the kind searched for
            newKindData = cloneDeep(this.state.kindData);
            newKindData[criteria.kind] = [];
          }
        } else {
          if (criteria.kind) {
            newKindData = cloneDeep(this.state.kindData);
            newKindData[criteria.kind] = res.data[criteria.kind];
          } else {
            newKindData = res.data;
          }
        }

        common.consoleLog(newKindData);
        const visualData = this.chartify(criteria.interval, criteria.categories, newKindData);
        common.consoleLog("VisualData ---->");
        common.consoleLog(visualData);

        this.setState({
          loading: false,
          kindData: newKindData,
          visualData: visualData
        });

      }).catch((err) => {
        common.consoleLog(err);
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
    this.fetchSubjects({
      interval: this.props.interval,
      categories: this.props.categories,
      subject: this.props.subject
    });
    window.addEventListener('resize', this.handleResize);
  }

  componentWillUnmount() {
    window.removeEventListener("resize", this.handleResize);
  }

  componentDidUpdate(prevProps) {
    if (isEqual(prevProps.interval, this.props.interval) &&
        isEqual(prevProps.categories, this.props.categories) &&
        isEqual(prevProps.subject, this.props.subject)) {
      common.consoleLog("SubjectVisual - interval / categories / subject props are same ... returning");
      return;
    }

    //
    // Is subject in visualData, ie. already displayed
    //
    if (this.state.visualData && this.props.subject) {
      for (const s of this.state.visualData.subjects) {
        if (s._id === this.props.subject._id) {
          return;
        }
      }
    }

    common.consoleLog("SubjectVisual - updating subjects");

    this.dimensions();
    this.fetchSubjects({
      interval: this.props.interval,
      categories: this.props.categories,
      subject: this.props.subject
    });
  }

  onUpdateKindPage(kind, page) {
    common.consoleLog("Kind: " + kind + " New Page: " + page);
    this.fetchSubjects({
      interval: this.props.interval,
      categories: this.props.categories,
      kind: kind,
      page: page
    });
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
        onSelectedChange={this.props.onSelectedChange}
        onUpdateCategoryFilter = {this.props.onUpdateCategoryFilter}
        onUpdateLegend = {this.props.onUpdateLegend}
        onUpdateKindPage = {this.onUpdateKindPage}
        interval = {this.props.interval}
        subject = {this.props.subject}
        categories = {this.props.categories}
        legend = {this.props.legend}
        data = {this.state.visualData}
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
    this.resetCategories = this.resetCategories.bind(this);
    this.handlePageClick = this.handlePageClick.bind(this);
    this.handlePageMouseUp = this.handlePageMouseUp.bind(this);
    this.handlePageMouseDown = this.handlePageMouseDown.bind(this);
    this.handlePageMouseOver = this.handlePageMouseOver.bind(this);
    this.handlePageMouseOut = this.handlePageMouseOut.bind(this);
    this.handleVisualClick = this.handleVisualClick.bind(this);
    this.handleVisualDoubleClick = this.handleVisualDoubleClick.bind(this);
    this.displaySelectionOutline = this.displaySelectionOutline.bind(this);

    this.clickTimer = 0;
    this.clickDelay = 200;
    this.clickPrevent = false;
  }

  componentDidMount() {
    common.consoleLog("SubjectSwimlane ComponentDidMount: STARTING");
    this.renderSwimlanes();
  }

  componentDidUpdate(prevProps) {
    if (this.props.subject && isEqual(this.props.subject.owner, this.svgId)) {
      // We called for this update with our own clicks so no need to update
      common.consoleLog("SubjectSwimLane - props are same ... returning");
      return;
    }

    if (prevProps.width === this.props.width &&
        prevProps.height === this.props.height &&
        isEqual(prevProps.interval, this.props.interval) &&
        isEqual(prevProps.subject, this.props.subject) &&
        isEqual(prevProps.data, this.props.data)
       ) {

      //
      // Show the subject as selected if displayed
      //
      this.displaySelectionOutline(this.props.subject, true);

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
  // Click function for page buttons
  //
  handlePageClick(event, d) {
    if (event.button > 0) {
      return;
    }

    var page;
    if (event.target.id.includes("up") && d.page > 0) {
      page =  d.page - 1;
    } else if (event.target.id.includes("down") && d.page < d.pages) {
      page = d.page + 1;
    }

    this.props.onUpdateKindPage(d.name, page);
  }

  //
  // Mouse Up function for page buttons
  //
  handlePageMouseUp(event, d) {
    if (d.button === 0) {
      d3Select(d.target).style("fill", null);
    }
  }

  //
  // Mouse Down function for page buttons
  //
  handlePageMouseDown(event, d) {
    if (d.button === 0) {
      d3Select(d.target).style("fill", "grey");
    }
  }

  //
  // Mouse Over function for page buttons
  //
  handlePageMouseOver(event, d) {
    this.pageBtnTooltip
      .transition()
      .duration(200)
      .attr('class', 'pageBtnTooltip');

    this.pageBtnTooltip
      .html("Page " + d.page + " of " + d.pages)
      .style("top", (event.layerY + 25) + "px")
      .style("left", event.layerX + "px");
  }

  //
  // Mouse Out function for page buttons
  //
  handlePageMouseOut(event, d) {
    this.pageBtnTooltip
      .transition()
      .duration(500)
      .attr('class', 'pageBtnTooltip pageBtnTooltipHide');
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
      this.props.onSelectedChange(this.props.interval, this.selected.current);
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
          common.consoleLog("SubjectVisual - handleVisualDoubleClick() " + res.data[0].name);
          this.props.onSelectedChange(res.data[0], d);
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
    this.props.onUpdateLegend({
      activeTab: this.props.legend.activeTab,
      visible: !this.props.legend.visible
    });
    event.stopPropagation();
  }

  //
  // Reset all categories back to visible
  //
  resetCategories(event) {
    this.props.onUpdateCategoryFilter(this.props.categories.map(a => {
      return {
        name: a.name,
        filtered: false
      };
    }));

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
  // Create a clip path for bounding the visual
  //
  createClipPath(defsElement, id, x, y) {
    defsElement.append('clipPath')
      .attr('id', id)
      .append('rect')
        .attr('x', x).attr('y', y)
        .attr('width', this.zoomSystem.innerWidth)
        .attr('height', this.zoomSystem.innerHeight);
  }

  //
  // Filter for the background of the page buttons
  //
  createPageButtonFilter(defsElement) {
    const pgBtnFilter = defsElement.append('filter')
      .attr("id", "pgBtnBackground")
      .attr("x", '15%').attr("y", '15%')
      .attr("width", '70%').attr("height", '70%');

    pgBtnFilter.append("feFlood")
      .attr("flood-color", "white")
      .attr("result","txtBackground");

    const mergeFilter = pgBtnFilter.append("feMerge");
    mergeFilter.append("feMergeNode").attr('in', 'txtBackground');
    mergeFilter.append("feMergeNode").attr('in', 'SourceGraphic');
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

    let categoryNames = this.props.categories.map(a => a.name);
    this.subjectColorCycle = d3ScaleOrdinal()
      .domain(categoryNames)
      .range(common.calcColours(categoryNames));

    const kindNames = this.props.data.kinds.map(a => a.name);

    const laneColorCycle = d3ScaleOrdinal()
      .domain(kindNames)
      .range(common.calcColours(kindNames));

    this.svg = d3Select('#' + this.svgId);

    // Remove all defs & subject-containers on refresh
    this.svg.selectAll('defs').remove();
    this.svg.selectAll('.subject-container').remove();

    const defs = this.svg.append("defs");

    this.createGradient(defs, this.props.data.categoryNames, this.subjectColorCycle);
    this.createGradient(defs, kindNames, laneColorCycle);
    this.createClipPath(defs, 'data-clip', this.margins.left, this.margins.top);
    this.createClipPath(defs, 'label-clip', -10, this.margins.top);
    this.createPageButtonFilter(defs);

    this.gchart = this.svg
      .append('g')
      .attr("class", "subject-container");

    this.gchart
      .append('rect')
      .attr('x', this.margins.left + 10)
      .attr('y', this.margins.top)
      .attr('width', this.zoomSystem.innerWidth - 10)
      .attr('height', this.zoomSystem.innerHeight)
      .attr('stroke', 'black')
      .attr('stroke-width', 4)
      .attr('fill', 'white');

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

    //
    // Workaround for stopping these attributes
    // being default set when call function is executed
    //
    this.gxAxis
      .attr('font-size', '')
      .attr('font-family', '');

    // draw the lanes for the chart
    this.gchart.append('g')
      .attr("id", "lane-lines")
      .attr('clip-path', 'url(#data-clip)')
      .selectAll('.laneLines')
      .data(this.props.data.lanes)
      .join('line')
      .classed('laneLines', true)
      .attr("transform", this.marginTranslation())
      .attr('stroke', d => d.kindLane ? 'black' : 'lightgray')
      .attr('stroke-width', d => d.kindLane ? 5 : 1);

    // Paint the backgrounds of the lanes
    this.gchart.append('g')
      .attr("id", "lane-backgrounds")
      .attr('clip-path', 'url(#data-clip)')
      .selectAll('.laneBackground')
      .data(this.props.data.kinds)
      .join("rect")
      .classed('laneBackground', true)
      .attr("transform", this.marginTranslation())
      .attr('fill', d => "url(#gradient-" + common.identifier(d.name) + ")");

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

    // Define the div for the tooltip
    this.pageBtnTooltip =
      d3Select('.pageBtnTooltip').node() ?
        d3Select('.pageBtnTooltip') :
          d3Select(".subject-visual-component")
            .append("div")
            .attr("id", "pageBtnTooltip")
            .classed('pageBtnTooltip', true)
            .classed('pageBtnTooltipHide', true);

    // draw the lane text
    this.gchart.append('g')
      .attr("id", "lane-names")
      .attr('clip-path', 'url(#label-clip)')
      .selectAll('.laneText')
      .data(this.props.data.kinds)
      .join('text')
      .classed('laneText', true)
      .text(d => d.name)
      .attr('text-anchor', 'end')
      .attr("transform", this.marginTranslation());

    //
    // The page up button for the kind
    //
    this.gchart.append('g')
      .attr("id", "lane-page-up-btns")
      .attr('clip-path', 'url(#data-clip)')
      .selectAll('.pageUpBtn')
      .data(this.props.data.kinds)
      .join('text')
      .attr("id", d => { return d.name + "-lane-page-up-btn" } )
      .classed('pageUpBtn', true)
      .classed('pageBtnHide', d => { return (d.page <= 1); })
      .text('\uf151')
      .attr('text-anchor', 'end')
      .attr('dx', -25)
      .attr('dominant-baseline', 'hanging') // fonts rendered to 'sit on the line' by default
      .attr("cursor", "pointer")
      .attr('filter', 'url(#pgBtnBackground')
      .attr("transform", this.marginTranslation())
      .on("click", this.handlePageClick)
      .on("mousedown", this.handlePageMouseDown)
      .on("mouseup", this.handlePageMouseUp)
      .on("mouseover", this.handlePageMouseOver)
      .on("mouseout", this.handlePageMouseOut);

      //
      // The page down button for the kind
      //
    this.gchart.append('g')
      .attr("id", "lane-page-down-btns")
      .attr('clip-path', 'url(#data-clip)')
      .selectAll('.pageDownBtn')
      .data(this.props.data.kinds)
      .join('text')
      .attr("id", d => { return d.name + "-lane-page-down-btn" } )
      .classed('pageDownBtn', true)
      .classed('pageBtnHide', d => { return (d.page >= d.pages); })
      .text('\uf150')
      .attr('text-anchor', 'end')
      .attr('dx', -25)
      .attr("cursor", "pointer")
      .attr('filter', 'url(#pgBtnBackground')
      .attr("transform", this.marginTranslation())
      .on("click", this.handlePageClick)
      .on("mousedown", this.handlePageMouseDown)
      .on("mouseup", this.handlePageMouseUp)
      .on("mouseover", this.handlePageMouseOver)
      .on("mouseout", this.handlePageMouseOut);

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
      .attr('y', d => parseFloat(yScale(d.laneStartIdx) + 0.5))
      .attr('width', this.zoomSystem.innerWidth)
      .attr('height', d => {
        let y1 = parseFloat(yScale(d.laneStartIdx)) + 0.5;
        let yn = parseFloat(yScale(d.laneStartIdx + d.lanes) + 0.5);
        return yn - y1;
      });

    // Update the lane text
    this.gchart
      .selectAll('.laneText')
      .attr('x', -10)
      .attr('y', d => {
        let yn = parseFloat(yScale(d.laneStartIdx + (d.lanes / 2))) + 0.5;
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

    // Update the page up button
    this.gchart
      .selectAll('.pageUpBtn')
      .attr('x', this.zoomSystem.innerWidth)
      .attr('y', d => parseFloat(yScale(d.laneStartIdx + 1)));

    // Update the page down button
    this.gchart
      .selectAll('.pageDownBtn')
      .attr('x', this.zoomSystem.innerWidth)
      .attr('y', d => parseFloat(yScale(d.laneStartIdx + d.lanes - 1)));

    // Update the interval boundaries
    this.updateIntervalBounds(this.gchart,
      this.props.interval.from, this.props.interval.to,
      this.props.data.lanes, xScale, yScale);
  }

  render() {
    if (! this.props.interval) {
      return (
        <div className="subject-visual-component">
          <div className="subject-visual-nocontent">
            <p>No geological interval. Try clicking on the Geological Timescale.</p>
          </div>
        </div>
      )
    }

    if (! this.props.data || ! this.props.data.subjects || this.props.data.subjects.length === 0) {
      return (
        <div className="subject-visual-component">
          <div className="subject-visual-nocontent">
            <p>No content available for the {this.props.interval.name} {this.props.interval.kind}</p>
            <p>
              <button className="subject-visual-reset-button" onClick={(e) => this.resetCategories(e)}>Click</button> to reset category filters
            </p>
          </div>
        </div>
      )
    }

    return (
      <div className="subject-visual-component">
        <div className="subject-visual-button">
          <button id="subject-visual-legend-btn" className="fas fa-bars" onClick={this.handleLegendClick}/>
        </div>
        <SubjectVisualLegend
          width = { this.props.width }
          height = { this.props.height }
          legend = { this.props.legend }
          onUpdateLegend = {this.props.onUpdateLegend}
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
