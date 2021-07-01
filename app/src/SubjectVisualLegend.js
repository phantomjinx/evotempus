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
    this.filterCategory = this.filterCategory.bind(this);
    this.isFilteredCategory = this.isFilteredCategory.bind(this);
  }

  //
  // Allows for the category names to be nicely re-rendered
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

  filterCategory(e, name) {
    this.props.onUpdateFilterCategory([name], e.target.checked);
  }

  isFilteredCategory(name) {
    const category = this.props.categories.find(category => {
      return category.name === name;
    });

    return category != null ? category.filtered : false;
  }

  paginateLegend() {
    const colorRange = common.calcCategoryColours(this.props.names);

    let items = [];
    if (this.props.names.length === 0) {
      items.push(
        <p className="subject-legend-content-none-found">No categories to display</p>
      )
    }

    const height = (this.props.height * 0.5) / this.state.totalPerPage;

    for (let i = 0; i < this.props.names.length; ++i) {
      const category = this.props.names[i];
      const colour = colorRange[i];

      items.push(
        <li key={category}>
          <label className="category-checkbox-label">
            <input type = "checkbox"
              defaultChecked = { this.isFilteredCategory(category) }
              onChange = {e => {}}
              onClick = {(event) => this.filterCategory(event, category)}>
            </input>
            <svg height = {height} width = {height}>
              <defs>
                <radialGradient cx = "50%" cy = "50%" r = "85%"
                  id = { "legend-gradient-" + common.identifier(category) }>
                  <stop offset = "0%" stopColor = { d3Color(colour).brighter().brighter() }/>
                  <stop offset = "90%" stopColor = {colour}/>
                </radialGradient>
              </defs>
              <rect
                width = {height}
                height = {height}
                fill = {"url(#legend-gradient-" + common.identifier(category) + ")"}
              />
            </svg>
            <span>{category}</span>
          </label>
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
          totalSize={this.props.names.length}
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
        <div className="subject-visual-legend-content">
          <div className="subject-visual-legend-title-row">
            <button
              className="subject-visual-legend-closebtn fa fa-times"
              onClick={this.props.onToggleLegend}>
            </button>
          </div>
          <div className="subject-visual-legend-paginated">
            {this.paginateLegend()}
          </div>
          <div className="subject-visual-legend-footer">
            <p>
              Click on each icon to exclude the category.<br/>
              Click again to restore.
            </p>
          </div>
        </div>
      </div>
    );
  }
}
