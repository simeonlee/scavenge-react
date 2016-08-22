import React from 'react';
import Nav from './nav.jsx';
import Map from './map.jsx';

const instagram_logo_path = '../images/instagramlogo.png';
const twitter_logo_path = '../images/twitterbird.png';

export default class App extends React.Component {
	constructor(props) {
    super(props);

    this.state = {
      currentPosition: null,
      searchRadius: null,
      queryTerms: [
        // search for all instagram pics
        'instagram',

        // search for healthy eating tips
        // 'paleo',
        // 'healthy',
        // 'keto',
        // 'ketogenic',
        // 'avocado',
        // 'juice',
        // 'juicepress',
        // 'smoothies',
        // 'chia',
        // 'salad',
        // 'salmon',
        // 'organic',
        // 'usdaorganic',
        // 'vegan',
        // 'raw',
        // 'glutenfree',
        // 'noGMO',
        // 'eatclean',
        // 'wholefoods',
        // 'kale',
        // 'broccoli',
        // 'cucumber',
        // 'ginger',
        // 'protein',
        // 'fiber'

        // search for fitness inspiration
        // 'fitness',
        // 'fitfam',
        // 'fitspo',
        // 'gym',
        // 'crossfit',
        // 'barre',
        // 'yoga',
        // 'pilates',
        // 'lifting',
        // 'training',
        // 'running',
        // 'boxing',
        // 'sweat',
      ],
      tweets: [],
      markers: {
        user: null,
        tweets: []
      }
    }
  }

  setAndSendDataToServer() {
    // TODO: clear markers
    // TODO: clear grid
    var currentPosition = this.state.currentPosition;
    var searchRadius = this.state.searchRadius;
    var queryTerms = this.state.queryTerms;
    socket.emit('my_geolocation', JSON.stringify({
      pos: currentPosition,
      search_radius: searchRadius,
      twitterQueryTerms: queryTerms
    }));
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