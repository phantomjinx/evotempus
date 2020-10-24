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

    this.state = { intervalId: '' };

    this.handleIntervalChange = this.handleIntervalChange.bind(this);
  }

  handleIntervalChange(interval) {
    console.log("Fired selected with new interval: " + interval);
    this.setState({ intervalId: interval });
    console.log(this.state);
  }

  componentDidUpdate() {
    console.log("this component dis update");
  }

  render() {
    return (
      <Container className="App">
        <Row className="parent">
          <Col sm={3}>
            <div className="wiki-inner">
              <Wiki
                interval={this.state.intervalId}
              />
            </div>
          </Col>
          <Col sm={8}>
            <div className="intervalvisual">
              <IntervalVisual
                width="600" height="600"
                onSelectedIntervalChange={this.handleIntervalChange}
              />
            </div>
          </Col>
        </Row>
      </Container>
    );
  }
}

export default App;
