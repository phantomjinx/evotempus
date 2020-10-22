import React from 'react';
import isEqual from 'lodash/isEqual';
import {hierarchy as d3Hierarchy, partition as d3Partition} from 'd3-hierarchy';
import {interpolate as d3Interpolate, quantize as d3Quantize} from 'd3-interpolate';
import {select as d3Select} from 'd3-selection';
import {scaleLinear as d3ScaleLinear, scaleSqrt as d3ScaleSqrt} from 'd3-scale';
import {scaleOrdinal as d3ScaleOrdinal} from 'd3-scale';
import {interpolateRainbow as d3InterpolateRainbow} from 'd3-scale-chromatic';
import {arc as d3Arc} from 'd3-shape';
import {json as d3Json} from 'd3-fetch';
import {transition as d3Transition} from 'd3-transition';
import {format as d3Format} from 'd3-format';

class Sunburst extends React.Component {

  constructor(props) {
    super(props);

    // This binding is necessary to make `this` work in the callback
    this.handleClick = this.handleClick.bind(this);
  }

  componentDidMount() {
    this.preRenderSunburst(this.props);
  }

  //
  // Makes a hierarchy of the json data
  // then partitions it ready for layout
  //
  partition(data) {
    const root = d3Hierarchy(data)
      .sum(d => d.value)
      .sort((a, b) => b.value - a.value);

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
  // Click function for zooming in and out
  //
  handleClick(event, p) {
    this.parent.datum(p.parent || this.root);

    this.root.each(d => d.target = {
      x0: Math.max(0, Math.min(1, (d.x0 - p.x0) / (p.x1 - p.x0))) * 2 * Math.PI,
      x1: Math.max(0, Math.min(1, (d.x1 - p.x0) / (p.x1 - p.x0))) * 2 * Math.PI,
      y0: Math.max(0, d.y0 - p.depth),
      y1: Math.max(0, d.y1 - p.depth)
    });

    const t = this.g.transition().duration(750);

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
  }

  renderSunburst(data) {
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
    const color = d3ScaleOrdinal(d3Quantize(d3InterpolateRainbow, data.children.length + 1))

    //
    // Build a fn for generating the arcs for each of the data block
    // Needed for handleClicked as well.
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
      .attr("fill", d => { while (d.depth > 1) d = d.parent; return color(d.data.name); })
      .attr("fill-opacity", d => this.arcVisible(d.current) ? (d.children ? 0.6 : 0.4) : 0)
      .attr("d", d => this.arc(d.current));

    this.paths.filter(d => d.children)
      .style("cursor", "pointer")
      .on("click", this.handleClick);

    //
    // Add titles to each segment
    // TODO: will need to change the algorithm for our data
    // format fn determines how to format a property - like printf
    //
    const format = d3Format(",d");
    this.paths.append("title")
      .text(d => `${d.ancestors().map(d => d.data.name).reverse().join("/")}\n${format(d.value)}`);

    //
    // Position labels for each of the segments
    //
    this.labels = this.g.append("g")
      .attr("pointer-events", "none")
      .attr("text-anchor", "middle")
      .style("user-select", "none")
      .selectAll("text")
      .data(rootDescendents)
      .join("text")
      .attr("dy", "0.35em")
      .attr("fill-opacity", d => +this.labelVisible(d.current))
      .attr("transform", d => this.labelTransform(d.current))
      .text(d => d.data.name);

    //
    // Create a central circle for zooming out
    //
    this.parent = this.g.append("circle")
      .datum(this.root)
      .attr("r", this.radius)
      .attr("fill", "none")
      .attr("pointer-events", "all")
      .on("click", this.handleClick);
  }

  preRenderSunburst(props) {
    const self = this;
    this.width = props.width || 300;
    this.height = props.height || 300;
    this.radius = (Math.min(this.width, this.height) / 6);

    //
    // Select the existing svg created by the initial render
    //
    this.svg = d3Select('svg');

    //
    // Append the main g ready for population
    //
    this.g = this.svg.append("g")
      .attr("transform", `translate(${this.width / 2},${this.width / 2})`);

    //
    // Use json to load the data from the file
    //
    d3Json("/flare-2.json").then(data => {
      self.renderSunburst(data);
    });
  }

  render() {
    return (
      <div id="evo-tempus-sb-div" className = "text-center">
        <svg
          id ="evo-tempus-sb-svg"
          width = {this.props.width}
          height = {this.props.height}
          style = {
            {
              font: "10px sans-serif",
              backgroundColor: "#fff",
            }
          }
        />
      </div>
    );
  }
}

export default Sunburst;
