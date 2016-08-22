import React from 'react';
import Nav from './nav.jsx';
import Map from './map.jsx';

class App extends React.Component {
	constructor(props) {
    super(props);

    // this.state = {}
  }

  render() {
    return (
      <div>
        <Nav />
        <div className="body-container">
          <Map />
        </div>
      </div>
    );
  }
}

export default App