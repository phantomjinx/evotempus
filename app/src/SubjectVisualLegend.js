import React from 'react';
import 'font-awesome/css/font-awesome.min.css';
import Pagination from "react-pagination-js";
import "react-pagination-js/dist/styles.css"; // import css
import {color as d3Color} from 'd3-color';
import * as common from './common';
import './SubjectVisualLegend.scss';

export default class SubjectVisualLegend extends React.Component {

  constructor(props) {
    super(props);

    this.pageFn = (newPage) => {
      this.setState({ intervalPage: newPage });
    };

    this.state = {
      currentPage: 1,
      totalPerPage: 10
    };

    this.handlePageClick = this.handlePageClick.bind(this);
  }

  //
  // Allows for the categories to be nicely re-rendered
  // as the height of the page gets resized.
  // Uses a ceiling of 10 to only ever shown 10 items on
  // a single page
  //
  calcTotalPerPage() {
    const total = Math.min(10, (this.props.height * 0.75) / 40);

    this.setState({
      totalPerPage: total
    })
  }

  componentDidMount() {
    this.calcTotalPerPage();
  }

  componentDidUpdate(prevProps) {
    if (prevProps.width === this.props.width &&
       prevProps.height === this.props.height) {
      return;
    }

    this.calcTotalPerPage();
  }

  handlePageClick(newPage) {
    this.setState({
      currentPage: newPage
    })
  }

  paginateLegend() {
    const colorRange = common.calcCategoryColours(this.props.categories);

    let items = [];
    if (this.props.categories.length === 0) {
      items.push(
        <p className="subject-legend-content-none-found">No categories to display</p>
      )
    }

    const height = (this.props.height * 0.75) / 15;

    for (let i = 0; i < this.props.categories.length; ++i) {
      const category = this.props.categories[i];
      const colour = colorRange[i];

      items.push(
        <li key={category}>
          <span>
            <svg height = {height} width = {height}>
              <defs>
                <radialGradient cx = "50%" cy = "50%" r = "85%"
                  id = { "legend-gradient-" + common.identifier(category) }>
                  <stop offset = "0%" stopColor = { d3Color(colour).brighter().brighter() }/>
                  <stop offset = "90%" stopColor = {colour}/>
                </radialGradient>
              </defs>
              <rect width = {height} height = {height} fill = {"url(#legend-gradient-" + common.identifier(category) + ")"}/>
            </svg>
            {category}
          </span>
        </li>
      );
    }

    let paginate = '';
    if (items.length > this.state.totalPerPage) {
      const offset = (this.state.currentPage - 1) * this.state.totalPerPage;
      items = items.slice(offset, offset + this.state.totalPerPage);

      paginate = (
        <Pagination
          currentPage={this.state.currentPage}
          totalSize={this.props.categories.length}
          sizePerPage={this.state.totalPerPage}
          changeCurrentPage={this.handlePageClick}
          theme="border-bottom"
        />
      );
    }

    return (
      <div>
        {paginate}
        <ul className="subject-visual-legend-items">
          {items}
        </ul>
      </div>
    )
  }

  render() {
    return (
      <div id="subject-visual-legend" className={this.props.visible ? 'show' : 'hide'}>
        <button
          className="subject-visual-legend-closebtn fa fa-times"
          onClick={this.props.onToggleLegend}>
        </button>
        <div className="subject-visual-legend-content">
          <p id="subject-visual-legend-title">Legend</p>
          <div className="subject-visual-legend-paginated">
            {this.paginateLegend()}
          </div>
        </div>
      </div>
    );
  }
}
