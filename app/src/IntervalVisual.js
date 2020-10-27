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
import * as common from './common';

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
    const errorMsg = "Error received from Interval Visual";
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
      <IntervalSunburst
        width = {this.props.width}
        height = {this.props.height}
        onSelectedIntervalChange = {this.props.onSelectedIntervalChange}
        data = {this.state.data}/>
    );
  }
}

class IntervalSunburst extends React.Component {

  constructor(props) {
    super(props);

    // This binding is necessary to make `this` work in the callback
    this.handleDoubleClick = this.handleDoubleClick.bind(this);
    this.handleClick = this.handleClick.bind(this);

    this.clickTimer = 0;
    this.clickDelay = 200;
    this.clickPrevent = false;
  }

  componentDidMount() {
    this.renderSunburst(this.props);
  }

  //
  // Makes a hierarchy of the json data
  // then partitions it ready for layout
  //
  partition(data) {
    const root = d3Stratify()
      .id(d => d._id)
      .parentId(d => d.parent)(data);

    //
    // root.sum calculates the value that the node represents
    // This is essential for a partition layout since they're
    // relative areas are determined by node.value
    //
    root
      .sum(d => {
        //
        // The computation takes this value and adds it to
        // the value of any children belonging to it. So to
        // get properly finished circles we should only consider
        // the leaf data only.
        //
        return d.children.length === 0 ? (d.to - d.from) : 0;
      })
      .sort((a, b) => a.from - b.from);

    //
    // Format the display values of the from and to
    //
    root.each(d => {

      const from = d.data.from;
      const to = d.data.to;

      d.displayFrom = common.displayYear(from);
      d.displayTo = common.displayYear(to);
    });

    //
    // Effectively calling partition(root)
    // Adds properties to root and all its children, such as x0, y0, x1, y1
    // size() will calculate the width and height
    //
    return d3Partition().size([2 * Math.PI, root.height + 1])(root);
  }

  //
  // Determines if an arc should be visible
  // based on its position in the hierarchy
  //
  arcVisible(d) {
    return d.y1 <= 3 && d.y0 >= 1 && d.x1 > d.x0;
  }

  //
  // Determines if a label should be visible
  // based on its position in the hierarchy
  //
  labelVisible(d) {
    return d.y1 <= 3 && d.y0 >= 1 && (d.y1 - d.y0) * (d.x1 - d.x0) > 0.03;
  }

  //
  // Position the label so it conforms to the angle of its arc
  //
  labelTransform(d) {
    const x = (d.x0 + d.x1) / 2 * 180 / Math.PI;
    const y = (d.y0 + d.y1) / 2 * this.radius;
    return `rotate(${x - 90}) translate(${y},0) rotate(${x < 180 ? 0 : 180})`;
  }

  //
  // Expiremental & naive truncation of text labels
  //
  labelTruncate(text) {
    const ellipsis = '...';
    const length = 7;

    return text.length <= length ? text : text.substring(0, length) + ellipsis;
  }

  //
  // Click function for zooming in and out
  //
  handleDoubleClick(event, p) {
    //
    // Prevent the single click firing when
    // the used actually double-clicked. Stops
    // needless updates out of the component
    //
    clearTimeout(this.clickTimer);
    this.clickPrevent = true;

    if (p === this.root) {
      // Nothing to do. Already at root
      return;
    }

    const t = this.g.transition().duration(750);

    //
    // Used for clicking on the central globe to zoom back up.
    // The globe (and so p) is the current root node so simply
    // using it as-is will not cause a zoom-out operation. Thus,
    // we have to reassign it to its own parent.
    //
    if (p === this.parent.datum()) {
      p = p.parent || this.root;
    }

    this.parent
      .datum(p || this.root)
      .text(d => d.data.name);

    this.parentLabel
      .datum(p || this.root)
      .transition(t)
      .text(d => d.data.name);

    this.root.each(d => d.target = {
      x0: Math.max(0, Math.min(1, (d.x0 - p.x0) / (p.x1 - p.x0))) * 2 * Math.PI,
      x1: Math.max(0, Math.min(1, (d.x1 - p.x0) / (p.x1 - p.x0))) * 2 * Math.PI,
      y0: Math.max(0, d.y0 - p.depth),
      y1: Math.max(0, d.y1 - p.depth)
    });

    //
    // Transition the data on all arcs, even the ones that aren’t visible,
    // so that if this transition is interrupted, entering arcs will start
    // the next transition from the desired position.
    //
    this.paths.transition(t)
      .tween("data", d => {
        const i = d3Interpolate(d.current, d.target);
        return t => d.current = i(t);
      })
      .attr("fill-opacity", d => this.arcVisible(d.target) ? (d.children ? 0.6 : 0.4) : 0)
      .attrTween("d", d => () => this.arc(d.current));

    this.labels.transition(t)
      .attr("fill-opacity", d => +this.labelVisible(d.target))
      .attrTween("transform", d => () => this.labelTransform(d.current));

    this.props.onSelectedIntervalChange(p.data);
  }

  //
  // Click function for selection
  //
  handleClick(event, p) {
    //
    // Put inside timer to allow for double-click
    // event to determine if it should be fired
    //
    this.clickTimer = setTimeout(() => {
      if (this.clickPrevent) {
        this.clickPrevent = false;
        return;
      }

      if (p === null || p === this.root) {
        this.selected = this.parentLabel.datum();
      } else {
        this.selected = p;
      }

      this.props.onSelectedIntervalChange(this.selected.data);
    }, this.clickDelay);
  }

  //
  // Renders the sunburst once the data has been
  // successfully retrieved from the database
  //
  renderSunburst(props, data) {
    data = data ? data : this.props.data;

    this.width = props.width || 300;
    this.height = props.height || 300;
    this.radius = (Math.min(this.width, this.height) / 6);

    //
    // Select the existing svg created by the initial render
    //
    this.svg = d3Select('svg');

    //
    // Define the gradient of the central circle
    //
    const radialGrad = this.svg.append("defs")
      .append("radialGradient")
	    .attr("id", "radialGradient")
	    .attr("cx", "30%")
	    .attr("cy", "30%")
	    .attr("r", "75%");

    //Append the color stops to the radial gradient
    radialGrad.append("stop")
    	.attr("offset", "0%")
    	.attr("stop-color", "#ffffff");
    radialGrad.append("stop")
    	.attr("offset", "50%")
    	.attr("stop-color", "#61dafb");
    radialGrad.append("stop")
      .attr("offset", "90%")
      .attr("stop-color", "#1a8a7c");
    radialGrad.append("stop")
    	.attr("offset",  "100%")
    	.attr("stop-color", "#164d21");

    //
    // Append the main g ready for population
    //
    this.g = this.svg.append("g")
      .attr("transform", `translate(${this.width / 2},${this.width / 2})`);

    //
    // Start to structure the data according to a partition heirarchical layout
    //
    this.root = this.partition(data);

    //
    // Copies the entire datum to itself
    //
    this.root.each(d => d.current = d);

    //
    // The descendants of the root node in a flat array
    // descendants function includes the root node so slice() excludes it
    //
    const rootDescendents = this.root.descendants().slice(1);

    //
    // Build a fn for colouring the data block different colours depending on location
    //
    const color = d3ScaleOrdinal(d3Quantize(d3InterpolateRainbow, this.root.children.length + 3))

    //
    // Build a fn for generating the arcs for each of the data block
    // Needed for handleDoubleClicked as well.
    //
    this.arc = d3Arc()
      .startAngle(d => d.x0)
      .endAngle(d => d.x1)
      .padAngle(d => Math.min((d.x1 - d.x0) / 2, 0.005))
      .padRadius(this.radius * 1.5)
      .innerRadius(d => d.y0 * this.radius)
      .outerRadius(d => Math.max(d.y0 * this.radius, d.y1 * this.radius - 1));

    //
    // Draw the paths of the segments and colour them in
    // Only those visible will be displayed
    //
    this.paths = this.g.append("g")
      .selectAll("path")
      .data(rootDescendents)
      .join("path")
      .attr("fill", d => {
        //
        // Finds the ultimate's parent colour
        // & tracks the depth
        //
        let depth = 0;
        while (d.depth > 1) {
          d = d.parent;
          depth++;
        }

        //
        // Gets the parent node colour then
        // darkens according to the level of depth
        //
        let c = d3Color(color(d.data.name))
        for (let i = 0; i < depth; ++i) {
          c = c.darker();
        }

        return c.toString();
      })
      .attr("fill-opacity", d => this.arcVisible(d.current) ? (d.children ? 0.6 : 0.4) : 0)
      .attr("d", d => this.arc(d.current))
      .on("click", this.handleClick);

    this.paths.filter(d => d.children)
      .style("cursor", "pointer")
      .on("dblclick", this.handleDoubleClick);

    //
    // Add titles to each segment
    // TODO: will need to change the algorithm for our data
    // format fn determines how to format a property - like printf
    //
    // const format = d3Format(",d");
    this.paths.append("title")
      .text(d => {
        return d.data.name + "\n" + d.displayFrom + "  to  " + d.displayTo;
      });

    //
    // Position labels for each of the segments
    //
    this.labels = this.g.append("g")
      .attr("pointer-events", "none")
      .attr("text-anchor", "middle")
      .style("user-select", "none")
      .style("font-weight", "bold")
      .selectAll("text")
      .data(rootDescendents)
      .join("text")
      .attr("dy", "0.35em")
      .attr("fill-opacity", d => +this.labelVisible(d.current))
      .attr("transform", d => this.labelTransform(d.current))
      .text(d => this.labelTruncate(d.data.name));

    //
    // Create a central circle for zooming out
    //
    this.parent = this.g.append("circle")
      .datum(this.parent || this.root)
      .attr("r", this.radius)
      .attr("fill", "url(#radialGradient)")
      .attr("pointer-events", "all")
      .style("cursor", "pointer")
      .text(d => d.data.name)
      .on("dblclick", this.handleDoubleClick)
      .on("click", this.handleClick);

    this.parentLabel = this.g.append("text")
      .datum(this.root)
      .join("text")
      .attr("id", "parent-label")
      .attr("pointer-events", "none")
      .attr("text-anchor", "middle")
      .style("user-select", "none")
      .style("font-weight", "bold")
      .attr("dy", "0.35em")
      .text(d => d.data.name)
  }

  render() {
    return (
      <div id="interval-visual-sb">
        <svg
          id ="interval-visual-sb-svg"
          width = {this.props.width}
          height = {this.props.height}
          style = {
            {
              font: "8pt sans-serif",
              backgroundColor: "#fff",
            }
          }
        />
      </div>
    );
  }
}
