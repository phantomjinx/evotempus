import React from 'react';
import logo from './logo.svg';
import './App.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Wiki from './Wiki.js';
import IntervalVisual from './IntervalVisual.js';

class App extends React.Component {

  constructor (props) {
    super(props);

    this.state = { interval: null };

    this.handleIntervalChange = this.handleIntervalChange.bind(this);
  }

  handleIntervalChange(interval) {
    this.setState({ interval: interval });
  }

  render() {
    return (
      <div>
        <header>
          <nav class="navbar navbar-expand-md navbar-dark fixed-top bg-dark">
            <a class="navbar-brand mr-auto" href="#">EvoTempus: Visualizations of Earth History</a>
            <form class="form-inline mt-2 mt-md-0">
              <input class="form-control mr-sm-2" type="text" placeholder="Search" aria-label="Search"/>
              <button class="btn btn-outline-success my-2 my-sm-0" type="submit">Search</button>
              </form>
          </nav>
        </header>
        <main role="main" class="flex-shrink-0">
          <Container className="App">
            <Row className="parent">
              <Col sm={3}>
                <div className="app-wiki">
                  <Wiki
                    interval={this.state.interval}
                    />
                </div>
              </Col>
              <Col id="interval-visual-col" sm={8}>
                <div className="app-intervalvisual">
                  <IntervalVisual
                    width="600" height="600"
                    onSelectedIntervalChange={this.handleIntervalChange}
                  />
                </div>
              </Col>
            </Row>
          </Container>
        </main>
        <footer class="footer">
          <p id="app-footer-copyright">
            &copy; P. G. Richardson 2020 - Licensed under <a href="https://www.gnu.org/licenses/gpl-3.0.en.html">GPL 3.0 or later</a>
          </p>
          <a id="app-footer-logo" href="https://en.wikipedia.org/wiki/Geologic_time_scale"
            target="_blank" rel="noopener noreferrer">
            <img src="/geologic-clock.png" alt="geo-clock"/>
          </a>
        </footer>
      </div>
    );
  }
}

export default App;
