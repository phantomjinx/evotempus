import React from 'react';
import {stratify as d3Stratify, partition as d3Partition} from 'd3-hierarchy';
import {interpolate as d3Interpolate, quantize as d3Quantize} from 'd3-interpolate';
import {select as d3Select} from 'd3-selection';
import {scaleOrdinal as d3ScaleOrdinal} from 'd3-scale';
import {interpolateRainbow as d3InterpolateRainbow} from 'd3-scale-chromatic';
import {arc as d3Arc} from 'd3-shape';
import {color as d3Color} from 'd3-color';
import Loading from './loading/Loading.js';
import ErrorMsg from './ErrorMsg.js';
import * as api from './api';
import * as common from './common';
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
        <div className="interval-visual-loading">
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
      <IntervalSunburst
        width = {this.props.width}
        height = {this.props.height}
        interval={this.props.interval}
        onSelectedIntervalChange = {this.props.onSelectedIntervalChange}
        data = {this.state.data}/>
    );
  }
}

class IntervalSunburst extends React.Component {

  constructor(props) {
    super(props);


    this.svgId = 'interval-visual-component-svg';

    // This binding is necessary to make `this` work in the callback
    this.handleDoubleClick = this.handleDoubleClick.bind(this);
    this.handleClick = this.handleClick.bind(this);

    this.clickTimer = 0;
    this.clickDelay = 200;
    this.clickPrevent = false;
  }

  componentDidMount() {
    this.renderInterval(this.props);
  }

  componentDidUpdate(prevProps) {
    if (prevProps.interval === this.props.interval) {
      return;
    }

    if (this.props.interval && this.props.interval.owner === this.svgId) {
      // We called for this update with our own clicks so no need to update
      return;
    }

    this.renderInterval(this.props);
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
      .sort((a, b) => {
        //
        // Whereas sum above uses the actual data objects, sort does not.
        // Therefore, we have to use ...data.from rather than ...from.
        //
        const r = a.data.from - b.data.from;
        return r;
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

  displaySelectionOutline(node, select) {
    if (! node) {
      return;
    }

    //
    // If zoomed in then the clicked-on object may be the central circle
    // so need to identify if this is the case. Otherwise find the path
    // using the data id.
    //
    // Note: this.parent is a selection so first need to find its first 'node'
    //       then get its data.
    //
    const id = this.parent.datum().data === node.data ? '#parent-circle' : '#path-' + node.data._id;

    d3Select(id).classed('path-selected', select);
    d3Select(id).classed('path-unselected', !select);
  }

  //
  // Click function for zooming in and out
  //
  handleDoubleClick(event, p) {
    //
    // Prevent the single click firing when
    // the user actually double-clicked. Stops
    // needless updates out of the component
    //
    clearTimeout(this.clickTimer);
    this.clickPrevent = true;

    if (p === this.root) {
      // Nothing to do. Already at root
      return;
    }

    const origSelected = this.selected;
    this.displaySelectionOutline(this.selected, false);

    const t = this.g.transition().duration(750);

    //
    // Used for clicking on the central globe to zoom back up.
    // The globe (and so p) is the current root node so simply
    // using it as-is will not cause a zoom-out operation. Thus,
    // we have to reassign it to its own parent.
    //
    // ie. is p the node in the parent selection
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

    this.root.each(d => {
      d.target = {
        x0: Math.max(0, Math.min(1, (d.x0 - p.x0) / (p.x1 - p.x0))) * 2 * Math.PI,
        x1: Math.max(0, Math.min(1, (d.x1 - p.x0) / (p.x1 - p.x0))) * 2 * Math.PI,
        y0: Math.max(0, d.y0 - p.depth),
        y1: Math.max(0, d.y1 - p.depth)
      };
      //
      // Updates the visible field in all nodes in accordance with the
      // logic of arcVisible
      //
      d.visible = this.arcVisible(d.target);
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
      .attr("fill-opacity", d => d.visible ? (d.children ? 0.6 : 0.4) : 0)
      .attr("stroke-opacity", d => d.visible ? (d.children ? 0.6 : 0.4) : 0)
      .attrTween("d", d => () => this.arc(d.current));

    this.paths
      .classed('path-invisible', d => ! d.visible);

    this.labels.transition(t)
      .attr("fill-opacity", d => +this.labelVisible(d.target))
      .attrTween("transform", d => () => this.labelTransform(d.current));

    //
    // Try and reselect the currently selected if still visible
    //
    this.handleClick(null, origSelected);
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

      this.displaySelectionOutline(this.selected, false);

      if (!p || !p.visible || p === this.root) {
        this.selected = this.parentLabel.datum();
      } else {
        this.selected = p;
      }

      this.displaySelectionOutline(this.selected, true);

      if (this.selected) {
        //
        // Tag the data with this as the owner
        //
        this.selected.data.owner = this.svgId;
        this.props.onSelectedIntervalChange(this.selected.data);
      }

    }, this.clickDelay);
  }

  //
  // Walk the hierarchy and 'zoom' into the chosen interval
  //
  traverseToInterval(interval) {
    if (! interval) {
      return;
    }

    //
    // Find the actual interval in our hierarchy
    //
    let visInterval = null;
    this.root.each(d => {
      if (visInterval) {
        return; // Already done
      }

      if (d.id === this.props.interval._id) {
        visInterval = d; // Found it!
      }
    });

    if (! visInterval) {
      console.log("Error: Cannot proceed due to failure to find navigated interval");
      return;
    }

    if (visInterval.children) {
      //
      // Has children so can become the central circle
      //
      this.handleDoubleClick(null, visInterval);
    } else {
      //
      // No children so select its parent instead then
      // highlight it to display its information
      //
      this.handleDoubleClick(null, visInterval.parent);
      this.handleClick(null, visInterval);
    }
  }

  //
  // Renders the sunburst once the data has been
  // successfully retrieved from the database
  //
  renderInterval(props) {
    this.radius = (Math.min(this.props.width, this.props.height) / 6);

    //
    // Select the existing svg created by the initial render
    //
    this.svg = d3Select('#' + this.svgId);

    // Remove all defs & subject-containers on refresh
    this.svg.selectAll('defs').remove();
    this.svg.selectAll('.interval-container').remove();

    //
    // Append the main g ready for population
    //
    this.g = this.svg.append("g")
      .attr("class", "interval-container")
      .attr("transform", `translate(${this.props.width / 2},${this.props.width / 2})`);

    //
    // Start to structure the data according to a partition heirarchical layout
    //
    this.root = this.partition(this.props.data);

    //
    // Build a fn for colouring the data block different colours depending on location
    //
    const color = d3ScaleOrdinal(d3Quantize(d3InterpolateRainbow, this.root.children.length + 3))

    this.root.each(d => {
      //
      // Copies the entire datum to itself
      //
      d.current = d;

      //
      // Cache the result of arcVisible for quick reads later
      //
      d.visible = this.arcVisible(d.current);
    });

    //
    // The descendants of the root node in a flat array
    // descendants function includes the root node so slice() excludes it
    //
    const rootDescendents = this.root.descendants().slice(1);

    //
    // Configure the svg definitions for the colour gradients
    //
    const defs = this.svg.append("defs");

    //
    // Generate a radial gradient
    //
    // Create gradient definitions for all the segments so they are coloured differently
    // using the 'color' above but also shade to white to give a sheen effect
    //
    const segmentGrads = defs.selectAll("radialGradient")
      .data(rootDescendents)
      .enter().append("radialGradient")
      .attr("id", d => "gradient-" + d.id)
      .attr("cx", "30%")
      .attr("cy", "30%")
      .attr("r", "75%");
    segmentGrads.append("stop")
      .attr("offset", "0%")
      .attr("stop-color", "white");
    segmentGrads.append("stop")
      .attr("offset", "75%")
      .attr("stop-color", d => {

      //
      // Finds the ultimate's parent colour & tracks the depth
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
    });

    //
    // Define the gradient of the central circle
    //
    const parentGradient = defs.append("radialGradient")
    .attr("id", "parentGradient")
    .attr("cx", "30%")
    .attr("cy", "30%")
    .attr("r", "75%");

    //Append the color stops to the radial gradient
    parentGradient.append("stop")
    .attr("offset", "0%")
    .attr("stop-color", "#ffffff");
    parentGradient.append("stop")
    .attr("offset", "50%")
    .attr("stop-color", "#61dafb");
    parentGradient.append("stop")
    .attr("offset", "90%")
    .attr("stop-color", "#1a8a7c");
    parentGradient.append("stop")
    .attr("offset",  "100%")
    .attr("stop-color", "#164d21");


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
      .attr('id', d => 'path-' + d.id)
      .classed('path-unselected', true)
      .classed('path-invisible', d => ! d.visible)
      .attr("fill", d => "url(#gradient-" + d.id + ")")
      .attr("fill-opacity", d => d.visible ? (d.children ? 0.6 : 0.4) : 0)
      .attr("stroke-opacity", d => d.visible ? (d.children ? 0.6 : 0.4) : 0)
      .attr("d", d => this.arc(d.current))
      .on("click", this.handleClick);

    this.paths.filter(d => d.children)
      .style("cursor", "pointer")
      .on("dblclick", this.handleDoubleClick);

    //
    // Add titles to each segment
    //
    this.paths.append("title")
      .text(d => {
        return d.data.name + "\n" + common.displayYear(d.data.from) + "  to  " + common.displayYear(d.data.to);
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
      .datum(this.root)
      .attr('id', 'parent-circle')
      .classed('path-unselected', true)
      .attr("r", this.radius)
      .attr("fill", "url(#parentGradient)")
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

    //
    // After complete rendering if an interval
    // has been assigned then traverse to it
    //
    this.traverseToInterval(this.props.interval);
  }

  render() {
    return (
      <div id="interval-visual-component">
        <svg
          id = { this.svgId }
          viewBox = {"0 0 " + this.props.width + " " + this.props.height}
          preserveAspectRatio="xMidYMid slice"
        />
      </div>
    );
  }
}
