import React from 'react';
import Tabs from "./Tabs.js";
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
      keySymbols: [],
      currentPage: 1,
      totalPerPage: 10,
      activeTab: ''
    };

    this.close = this.close.bind(this);
    this.cacheActiveTab = this.cacheActiveTab.bind(this);
    this.handlePageClick = this.handlePageClick.bind(this);
    this.filterCategory = this.filterCategory.bind(this);

  }

  //
  // Allows for the category names to be nicely re-rendered
  // as the height of the page gets resized.
  // Uses a ceiling of 10 to only ever shown 10 items on
  // a single page
  //
  calcTotalPerPage() {
    return Math.min(10, (this.props.height * 0.5) / 40);
  }

  componentDidMount() {
    let keySymbols = [];

    for (let i = 0; i < this.props.names.length; ++i) {
      const name = this.props.names[i];
      const colour = common.calcColour(name);

      const category = this.props.categories.find(category => {
        return category.name === name;
      });
      const hint = common.getHint(name);
      const keySymbol = {
        ...category,
        ...hint
      };

      keySymbol.colour = colour;
      keySymbols.push(keySymbol);
    }

    this.setState({
      totalPerPage: this.calcTotalPerPage(),
      keySymbols: keySymbols,
      activeTab: this.props.legend.activeTab
    });
  }

  componentDidUpdate(prevProps) {
    if (prevProps.width === this.props.width &&
       prevProps.height === this.props.height) {
      return;
    }

    this.setState({
      totalPerPage: this.calcTotalPerPage()
    });

  }

  close() {
    this.props.onUpdateLegend({
      activeTab: this.props.legend.activeTab,
      visible: false
    });
  }

  cacheActiveTab(tabName) {
    this.props.onUpdateLegend({
      activeTab: tabName,
      visible: this.props.legend.visible
    });
  }

  handlePageClick(newPage) {
    this.setState({
      currentPage: newPage
    })
  }

  filterCategory(e, keySymbol) {
    this.props.onUpdateFilterCategory([keySymbol.name], !keySymbol.filtered);
  }

  renderKindBlock(title, keySymbols) {
    let items = [];
    if (keySymbols.length === 0) {
      return (
        <div label={title} className="subject-visual-legend-paginate">
          <div className="subject-visual-legend-items">
            <p className="subject-legend-content-none-found">No categories</p>
          </div>
        </div>
      )
    }

    const height = (this.props.height * 0.5) / this.state.totalPerPage;

    for (const keySymbol of keySymbols) {

      let symText = "";
      if (keySymbol.link === '') {
        symText = (
          <span style = {{opacity: keySymbol.filtered ? '0.2' : '1'}}>
            {keySymbol.name}
          </span>
        );
      } else {
        symText = (
          <a
            href = {common.wikiLink + keySymbol.link}
            style = {{opacity: keySymbol.filtered ? '0.2' : '1'}}
            target = "_blank" rel="noopener noreferrer">
            {keySymbol.name}
          </a>
        );
      }

      items.push(
        <li key={title + '-' + keySymbol.name}>

          <div style = {{height: height + 'px', width: height + 'px'}}
               onClick = {(event) => this.filterCategory(event, keySymbol)}>

            <svg height = {height} width = {height}>
              <defs>
                <radialGradient cx = "50%" cy = "50%" r = "85%"
                  id = { "legend-gradient-" + common.identifier(keySymbol.name) }>
                  <stop offset = "0%" stopColor = { d3Color(keySymbol.colour).brighter().brighter() }/>
                  <stop offset = "90%" stopColor = {keySymbol.colour}/>
                </radialGradient>
              </defs>
              <rect
                x = {(height - (height * 0.75)) / 2}
                y = {(height - (height * 0.75)) / 2}
                width = {height * 0.75}
                height = {height * 0.75}
                fill = {"url(#legend-gradient-" + common.identifier(keySymbol.name) + ")"}
                strokeWidth = {keySymbol.filtered ? '1' : '0'}
                stroke = {keySymbol.filtered ? 'black' : ''}
                opacity = {keySymbol.filtered ? '0.2' : '1'}
              />
            </svg>
          </div>
          {symText}
        </li>
      );
    }

    return (
      <div label={title}>
        <div className="subject-visual-legend-items">
          <ul className="subject-visual-legend-items-inner">
            {items}
          </ul>
        </div>
        <div className="subject-visual-legend-footer">
        </div>
      </div>
    )
  }

  renderKinds() {
    if (this.state.keySymbols.length === 0) {
      return;
    }

    let kinds = new Map();

    //
    // Create map of kinds from the categories
    //
    for (const kind of common.getKinds()) {
      kinds.set(kind, []);
    }

    for (const keySymbol of this.state.keySymbols) {
      let items = kinds.get(keySymbol.parent);
      items.push(keySymbol);
    }

    // Create the paginated tabs of categories
    let kindTabs = Array.from(kinds, ([key, value]) => {
      return this.renderKindBlock(key, value);
    });

    return (
      <Tabs
        activeTab={this.props.legend.activeTab}
        onTabClicked={this.cacheActiveTab}>
        {kindTabs}
      </Tabs>
    );
  }

  render() {
    return (
      <div id="subject-visual-legend" className={this.props.legend.visible ? 'show' : 'hide'}>
        <div className="subject-visual-legend-content">
          <div className="subject-visual-legend-title-row">
            <button
              className="subject-visual-legend-closebtn fas fa-times"
              onClick={this.close}>
            </button>
          </div>
          <div className="subject-visual-legend-text">
            <p>
              Click on the category icon to filter
            </p>
          </div>
          <div className="subject-visual-legend-kinds">
            {this.renderKinds()}
          </div>
        </div>
      </div>
    );
  }
}
