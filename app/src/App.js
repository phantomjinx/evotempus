import React from 'react';
import './App.scss';
import 'bootstrap/dist/css/bootstrap.min.css';
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Wiki from './Wiki.js';
import IntervalVisual from './IntervalVisual.js';
import SubjectVisual from './SubjectVisual.js';

class App extends React.Component {

  constructor (props) {
    super(props);

    this.state = { interval: null };

    this.handleIntervalChange = this.handleIntervalChange.bind(this);
  }

  handleIntervalChange(interval) {
    this.setState({ interval: interval });
  }

  handleSubjectChange(subject) {
    console.log("Subject: ", subject ? subject.id : "none")
    // this.setState({ interval: interval });
  }

  render() {
    return (
      <div>
        <header>
          <nav class="navbar navbar-expand-md navbar-dark fixed-top bg-dark">
            <a class="navbar-brand mr-auto" href="/">EvoTempus: Dashboard of Earth History</a>
            <form class="form-inline mt-2 mt-md-0">
              <input class="form-control mr-sm-2" type="text" placeholder="Search" aria-label="Search"/>
              <button class="btn btn-outline-success my-2 my-sm-0" type="submit">Search</button>
              </form>
          </nav>
        </header>
        <main role="main">
          <Container fluid className="app">
            <Row className="visual-row">
              <Col xs={5.5}>
                <IntervalVisual
                    width="450" height="450"
                    onSelectedIntervalChange={this.handleIntervalChange}
                />
              </Col>
              <Col md="auto">
                <SubjectVisual
                  width="600" height="600"
                  onSelectedSubjectChange={this.handleSubjectChange}
                />
                <p> HELLO WORLD! </p>
              </Col>
            </Row>
            <Row>
              <Wiki
                interval={this.state.interval}
              />
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
