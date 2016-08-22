import React from 'react';
import mapStyle from '../styles/light-map'

export default class Map extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      location: {
        // Washington Square Park
        lat: 40.7308,
        lng: -73.9973
      }
    }
  }

  componentWillMount() {
    this.geolocate();
  }

  componentDidMount() {
    this.initializeMap();
  }

  initializeMap() {
    this.map = new google.maps.Map(document.getElementById('map'), {

      // Make map center the default location until the geolocation function finishes finding user
      center: this.state.location,
      
      // Zoom the map to neighborhood level of detail
      zoom: 15,
      
      // No terrain view or satellite view
      mapTypeId: google.maps.MapTypeId.ROADMAP,

      // Change the style of the map to light / dark
      styles: mapStyle,

      // Don't show the ui controls
      // disableDefaultUI: true,

      // Only show zoom controls
      zoomControl: true,
      zoomControlOptions: {
        position: google.maps.ControlPosition.RIGHT_BOTTOM
      },
      mapTypeControl: false,
      scaleControl: false,
      streetViewControl: false,
      rotateControl: false,
      fullscreenControl: false

    });

    // Set up Google Places API autocomplete to search for new locations to get more content
    // https://developers.google.com/maps/documentation/javascript/examples/places-autocomplete
    var input = document.getElementById('google-search');
    var autocomplete = new google.maps.places.Autocomplete(input);

    // Bias results to the bounds of the viewport
    autocomplete.bindTo('bounds', map);

    // Do the following when the place value is changed...
    autocomplete.addListener('place_changed', function() {
      
      var place = autocomplete.getPlace();

      // 'place' hopefully has geometry-related information
      // Geometry-related info includes location (lat,lng) and preferred viewport on map
      // Viewport specified as two lat,lng values defining southwest and
      // northeast corner of viewport bounding box - frames the result(s)

      // Geocoding is process of converting addresses into geographic coordinates

      // if (!place.geometry) {
        // window.alert("Autocomplete's returned place contains no geometry");
        // return;
      // }

      // If the place has a geometry, then present it on a map.
      // if (place.geometry.viewport) {

      //   map.fitBounds(place.geometry.viewport);

      // } else {

      this.map.setCenter(place.geometry.location);
      this.map.setZoom(15);

      // }

      var address = '';
      if (place.address_components) {
        address = [
          (place.address_components[0] && place.address_components[0].short_name || ''),
          (place.address_components[1] && place.address_components[1].short_name || ''),
          (place.address_components[2] && place.address_components[2].short_name || '')
        ].join(' ');
      }
      console.log(address);

      // Mark new location
      // var new_location = place.geometry.location;
      // var icon_img_src = '../images/newlocation@2x.png';
      // var icon_dim = {
      //   width: 55,
      //   height: 62
      // }
      // var marker_title = 'new location';
      // my.createMapMarker(new_location, icon_img_src, icon_dim, marker_title);

      // console.log(new_location);
      
      // save new_location to my.pos variable to persist user's new location across files
      // my.pos = new_location;

      // Attach user geolocation data and twitter query terms to a data object
      // that we will send to the server to make API calls with based on user context
      // my.setAndSendDataToServer(new_location, search_radius, my.twitterQueryTerms);

    });
  }

  geolocate() {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((position) => {        

        // Create marker for user position
        var position = {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        };
        var icon_img_src = require('../images/homeicon@2x.png');
        var icon_dim = {
          width: 55,
          height: 62
        }
        var marker_title = 'you';
        this.createMarker(position, icon_img_src, icon_dim, marker_title);

        console.log('User located at ' + position.lat + ', ' + position.lng);

        // for calculating distances, etc.
        // my.pos = pos;
        this.setState({'location': position});

        // Attach user geolocation data and twitter query terms to a data object
        // that we will send to the server to make API calls with based on user context
        // my.setAndSendDataToServer(pos, search_radius, my.twitterQueryTerms);

        // Set map to center on position
        this.map.setCenter(this.state.location);
      }, function() {
        alert('Geolocation failed');
      });
    } else {
      alert('Your browser doesn\'t support geolocation');
    }
  }

  createMarker(pos_lat_lng, icon_img_src, icon_dim, marker_title, tweet) {
    var icon_width = icon_dim.width;
    var icon_height = icon_dim.height;
    var marker_icon = new google.maps.MarkerImage(icon_img_src, null, null, null, new google.maps.Size(icon_width,icon_height));
    var marker = new google.maps.Marker({
      position: pos_lat_lng,
      icon: marker_icon,
      title: marker_title,
      animation: google.maps.Animation.DROP
    });
    marker.setMap(this.map);
    marker.setAnimation(google.maps.Animation.BOUNCE);
    this.addMarkerFunctionality(marker, this.customizeMarkerAnimation, marker_title, tweet);
    return marker;
  }

  addMarkerFunctionality(marker, callback, marker_title, tweet) {
    // Toggles animation
    marker.toggleBounce = function(){
      if (this.getAnimation() !== null) {
        this.setAnimation(null);
      } else {
        this.setAnimation(google.maps.Animation.BOUNCE);
      }
    }

    // Stops animation
    marker.stopAnimation = function() {
      if (this.getAnimation() !== null) {
        this.setAnimation(null);
      }
    }

    // Have the marker stop animating automatically
    marker.setAnimationTimeout = function(sec){
      var that = this;
      setTimeout(function(){
        that.stopAnimation();
      },sec*1000)
    }

    // Add a listener to marker's infowindow so that when you
    // close the infowindow, the associated marker stops its animation
    marker.infowindowClose = function(){
      var that = this; 
      google.maps.event.addListener(marker.infowindow,'closeclick',function(){
        console.log('Closed infowindow!');
        that.stopAnimation(); // referring to 'marker'
        this.state = false; // referring to 'infowindow'
      });
    }

    marker.addToggle = function(){
      marker.addListener('click', function() {
        this.toggleBounce();
        if (this.infowindow) {
          if (this.infowindow.state) { // if infowindow is currently open
            console.log('closing infowindow');
            this.infowindow.close();
            this.infowindow.state = false; // currently not open
          } else {
            console.log('opening infowindow');
            this.infowindow.open(map, this);
            this.infowindow.state = true; // currently open
          }
        }
      })
    }

    callback(marker, marker_title, tweet);
  }

  customizeMarkerAnimation(marker, marker_title, tweet){

    // user geolocation
    if (marker_title === 'you' || marker_title === 'new location') { 

      marker.setAnimationTimeout(10);
      marker.addListener('click', function() {
        this.map.setZoom(15);
        this.toggleBounce();
      });

    // twitter / instagram
    } else if (marker_title === 'scavenged') {

      // Link to sites external to Twitter... for example, a link to an instagram photo
      var external_link = tweet.external_link;

      // Try to extract the url to an Instagram photo's url
      if (tweet.instagram_data) {
        var thumbnail_url = tweet.instagram_data.thumbnail_url;
      }

      // return an infowindow and attach to the marker
      var infowindow = my.createInfowindow(external_link, thumbnail_url, marker);

    // yelp
    } else if (marker_title === 'place') { 

      marker.setAnimationTimeout(5);
      marker.addListener('click', marker.toggleBounce);

    }
  }

  render() {
    return (
  	  <div id="map">
  	    <div>Google Map</div>
  	  </div>
  	);
  }
}