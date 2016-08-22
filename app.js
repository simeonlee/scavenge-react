/* 
 * In this file:
 * I receive data from the client including the user's geolocation via socket.io
 * Make a query to the Twitter API using the client's parameters
 * Expand the shortened t.co url's that Twitter replaces its external links with
 * Check if the link is related to Instagram
 * If related to Instagram, we get the photo's metadata including a url to the img
 * Then we use socket.io to send all the Twitter and Instagram data back to the client
 */

// Require the modules needed
var compression = require('compression');
var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');

// Authentication stuffs for Twitter and Yelp API
var oauthSignature = require('oauth-signature');
var n = require('nonce')();
var request = require('request');
var qs = require('querystring');
var _ = require('lodash');

// Middleware to serve files from within a given root directory
var serveStatic = require('serve-static');

// Create express server
var app = express();

var debug = require('debug')('twitter-test-1:server');
var http = require('http');

var port = normalizePort(process.env.PORT || '3000');
app.set('port', port);

var server = http.createServer(app);

// We are using socket.io to communicate with client
var io = require('socket.io')(server);



// This npm unwraps the t.co urls into the expanded link
// E.g., t.co/xxx --> www.instagram.com/xxx
var reverse = require('long-url');

// Will contain { lat: x, lng: y } of user
var pos = {
  lat: 40.7308,
  lng: -73.9973
}

// Contain the latest twitter query terms in the app.js scope
var twitterQueryTerms;

server.listen(port);
server.on('error', onError);
server.on('listening', onListening);

// Open up a socket.io receiver
io.on('connection', function(socket) {
  socket.on('my_geolocation', function(clientToServer) {
    
    var clientData = JSON.parse(clientToServer);
    
    // Query radius in miles
    var search_radius = clientToServer.search_radius;

    // Set user position
    pos = clientData.pos;
    var lat = pos.lat;
    var lng = pos.lng;
    console.log('Client geolocation: '+lat+','+lng);

    // twitterQueryTerms = ['paleo','healthy','keto','ketogenic','avocado','juice','chia','salad'];
    twitterQueryTerms = clientData.twitterQueryTerms;

    // Initiate the Twitter API call
    twitterSearch(pos, search_radius, twitterQueryTerms);

  });

  // called from yelp.js when the user clicks on a grid item
  // best guesses at what location the instagram was taken
  socket.on('yelp_request_data', function(yelp_request_data){
    var yelp_term = yelp_request_data.term;
    var yelp_latLng = yelp_request_data.latLng;
    var set_parameters = {
      term: yelp_term
    }
    requestYelp(set_parameters, yelp_latLng, yelpCallback);
  })
});

// Normalize a port into a number, string, or false
function normalizePort(val) {
  var port = parseInt(val, 10);

  if (isNaN(port)) {
    // named pipe
    return val;
  }

  if (port >= 0) {
    // port number
    return port;
  }

  return false;
}

// Event listener for HTTP server "error" event
function onError(error) {
  if (error.syscall !== 'listen') {
    throw error;
  }

  var bind = typeof port === 'string'
    ? 'Pipe ' + port
    : 'Port ' + port;

  // handle specific listen errors with friendly messages
  switch (error.code) {
    case 'EACCES':
      console.error(bind + ' requires elevated privileges');
      process.exit(1);
      break;
    case 'EADDRINUSE':
      console.error(bind + ' is already in use');
      process.exit(1);
      break;
    default:
      throw error;
  }
}

// Event listener for HTTP server "listening" event
function onListening() {
  var addr = server.address();
  var bind = typeof addr === 'string'
    ? 'pipe ' + addr
    : 'port ' + addr.port;
  debug('Listening on ' + bind);
}

// Access Twitter API
var Twitter = require('twitter-node-client').Twitter;

// Dummy data
var twitter_API_data = {test: 'No twitter data yet'};

// Secret!!!
var config = {
  "consumerKey": process.env.TWITTER_CONSUMERKEY,
  "consumerSecret": process.env.TWITTER_CONSUMERSECRET,
  "accessToken": process.env.TWITTER_ACCESSTOKEN,
  "accessTokenSecret": process.env.TWITTER_ACCESSTOKENSECRET,
  "callBackUrl": "https://infinite-inlet-93119.herokuapp.com/"
}

var twitter = new Twitter(config);

var twitterSearch = function(userGeo, search_radius, twitterQueryTerms) {

  // Reference:
  // https://dev.twitter.com/rest/reference/get/search/tweets

  if (userGeo) {
    var lat = userGeo.lat;
    var lng = userGeo.lng;
  } else {
    var lat = 40.7308;
    var lng = -73.9973;
  }

  // UTF-8, URL-encoded search query of 500 characters maximum, including operators
  var twitter_query = twitterQueryTerms.join(' OR ');
  
  // 37.781157,-122.398720,1mi
  var geocode_input = lat+','+lng+',2mi';

  // Maximum results of 100, defaults to 15
  var results_count = 100;

  console.log('Twitter Query String:  ' + twitter_query);
  console.log('Twitter Query String Length:  ' + twitter_query.length + ' (500 char maximum)');
  console.log('Twitter Geocode Input:  ' + geocode_input);
  console.log('Number Of Results To Return:  ' + results_count);

  return twitter.getSearch({
    
    // Twitter query search terms
    'q': twitter_query,

    // 'latitude,longitude,radius'
    'geocode': geocode_input,

    // Search for this many results
    'count': results_count,

    // Bias towards recent tweets
    // 'result_type': 'recent'

  }, error, success); // callbacks
}


// Callback functions for Twitter API call:
// Error
var error = function (err, response, body) {
  console.log('ERROR [%s]', err);
};

// Variables for the success callback
var scavenge_tweets = [];
var debugindex1;
var debugindex2;
var debugindex3;

// Success
// Lots of console.log's to debug with! Can trace path through functions
var success = function (data) {

  // Wipe the slate clean
  debugindex1 = 1;
  debugindex2 = 1;
  debugindex3 = 1;
  expanded_instagram_url_arr = [];
  thumbnail_url_arr = [];

  twitter_API_data = JSON.parse(data);
  
  // Tweets
  var statuses = twitter_API_data.statuses;
  
  // Show what the query was that resulted in this tweet selection
  var query = twitter_API_data.search_metadata.query;
  query = decodeURIComponent(query);

  // Clear array of any existing elements  
  scavenge_tweets = [];

  console.log('LOCATION:  We are in the success handler function of the twitter API caller');
  console.log('NEWS:  We have returned ' + statuses.length + ' results');
  console.log('');
  console.log('ACTION:  Starting for loop:');
  console.log('');

  for (var i = 0; i < statuses.length; i++) {

    console.log(' ');
    console.log(debugindex1 + '  ACTION:  Setting and attaching main variables to the scavenge_tweets array')
    console.log(debugindex1 + '  text:  ' + text);

    // Extract individual tweet status object
    var status = statuses[i];
    
    // Extract text of tweet including t.co url
    var text = status.text;

    // Define variables for each tweet's elements
    var text = status.text;
    var coord = status.coordinates;
    var user = status.user;
    var timestamp = status.created_at;
    var tweetID = status.id_str;
    var source = status.source;
    var hashtags = status.entities.hashtags;
    var favorite_count = status.favorite_count;
    var retweet_count = status.retweet_count;
    var truncated = status.truncated;
    var sensitive = status.possibly_sensitive;

    if (coord) {
      var ll = coord.coordinates;
      var lat = ll[1];
      var lng = ll[0];
      var latLng = {
        lat: lat,
        lng: lng
      }
    } else {
      var latLng = null;
    }

    // Only add to scavenge_tweets / send to client if there is a link to instagram pic
    // When we add support for other links later on, can add additional filters
    if (source.indexOf('instagram') > -1) {

      // Create a new array of select data to be sent to client
      scavenge_tweets.push({
        tweetID: tweetID,
        user: user,
        text: text,
        hashtags: hashtags,
        latLng: latLng,
        timestamp: timestamp,
        source: source,
        favorite_count: favorite_count,
        retweet_count: retweet_count,
        truncated: truncated,
        sensitive: sensitive,
        query: query
      });

    }
    
    console.log(debugindex1 + '  ACTION:  Calling expandURL function now');

    // This function expands the t.co url into the external link
    expandURL(status, getInstagramData); 
  }
};

// Put the instagram urls in here
var expanded_instagram_url_arr = [];

var expandURL = function(status, getInstagramData) {
  
  console.log(debugindex1 + '  LOCATION:  In expandURL function');
  debugindex1++;

  var text = status.text;
  var tweetID = status.id_str;  

  // Find the link in the text that starts with 'https://t.co/xxx'
  var expression = /https?:\/\/t\.[a-z]{2,6}\/([-a-zA-Z0-9@:%_\+.~#?&//=]*)/gi;
  var regex = new RegExp(expression);

  // Some tweets link to other sites, some don't...
  if (text.match(regex)) {

    // Get t.co url and remove from text string
    var t_coURL = text.match(regex).toString();
    var t_coURL_index = text.indexOf(t_coURL);
    text = text.slice(0,t_coURL_index);

    // 'reverse' is npm package that unwraps our t.co url
    reverse(t_coURL, function(err, expandedURL) {

      if (expandedURL) {

        console.log(' ');
        console.log(debugindex2 + '  t_coURL:  ' + t_coURL);
        console.log(debugindex2 + '  NEWS:  We\'ve received the expanded url from the API');
        console.log(debugindex2 + '  ACTION:  Now starting the secondary "for" loop to locate the correct tweet'+
          ' and attach the retrieved instagram url');
        console.log(debugindex2 + '  expandedurl:  ' + expandedURL);

        // Push the expanded instagram urls to its own array so that we can grab array properties like 'length'
        // This helps us keep track of how many instagram url's we have found in our whole tweet set
        if (expandedURL.includes("www.instagram.com")) {
          expanded_instagram_url_arr.push(expandedURL);
          console.log(' ');
          console.log('Length of expanded_instagram_url_arr: '+expanded_instagram_url_arr.length);
        }

        for (var i = 0; i < scavenge_tweets.length; i++) {
          var scavenge_tweet = scavenge_tweets[i];
          if (scavenge_tweet.tweetID === tweetID) {
            scavenge_tweet.text = text;
            scavenge_tweet.external_link = expandedURL;
            getInstagramData(scavenge_tweet, expandedURL);
          }
        }
      }
    });
  }
}

// To store thumbnail url's so we can count how many we have later via Array's length property
var thumbnail_url_arr = [];

// Pull out instagram media data which contains direct link to photo URL
// Helpful since Instagram has virtually closed off their API
var getInstagramData = function(scavenge_tweet, expandedURL) {

  // Experimented with promise implementation...
  return new Promise(function(resolve, reject) {

    console.log(' ');
    console.log(debugindex2 + '  LOCATION:  In getInstagramData function');

    // Check if it's an instagram link
    if (expandedURL.indexOf('instagram') > -1) {
      
      // Instagram api link that returns some media data
      var instaAPIURL = 'https://api.instagram.com/oembed?callback=&url='+expandedURL;

      // AJAX call to get Instagram photo metadata
      request(instaAPIURL, function(err, resp, body) {

        console.log(' ');
        console.log(debugindex3 + '  ACTION:  Requesting data from the Instagram API');
        console.log(debugindex3 + '  instaAPIurl:  ' + instaAPIURL);

        // Parse and set instagram data
        try {
          var instagram_data = JSON.parse(body);
          console.log(debugindex3 + '  thumbnailurl:  ' + instagram_data.thumbnail_url);
        }
        catch(err) {
          var instagram_data = body;
          console.log(debugindex3 + '  ERROR:  Cannot parse instagram_data');
        }

        // attach to scavenge_tweet
        scavenge_tweet.instagram_data = instagram_data;
        
        // Instagram thumbnail
        if (instagram_data) {
          var thumbnail_url = instagram_data.thumbnail_url;
        }
        
        // Store the instagram thumbnail url in an array
        if (thumbnail_url) {
          thumbnail_url_arr.push(thumbnail_url);
        } else {
          thumbnail_url_arr.push('noinstagramurl');
        }
        
        console.log(debugindex3);
        console.log(debugindex3 + '  ACTION:  Checking if we have unpackaged the last thumbnail_url before'+
          ' opening the socket to the client');
        console.log(' ');
        // Length of the instagram url array
        console.log('Length of thumbnail_url_arr: '+thumbnail_url_arr.length);

        // If these two variables below match, then we know we have reached the last variable of the second array
        var expanded_arr_length = expanded_instagram_url_arr.length;
        var thumbnail_arr_length = thumbnail_url_arr.length;

        // Find out if this is the last scavenge_tweet in scavenge_tweets
        if (expanded_arr_length === thumbnail_arr_length) {
          console.log(debugindex3 + '  NEWS:  Last tweet in the array! Opening socket and sending data!');
            // Send data to client via socket.io
            io.sockets.emit('scavenge_tweets', scavenge_tweets);
        }
        debugindex3++;
      });
    }
    debugindex2++;
  });
}

// We want to include caching of the content with max age the number of milliseconds in one day
var oneDay = 86400000;

// We want to make sure our static content is compressed using gzip
// Use compress middleware that is bundled with Express
// New call to compress content before any other middlewares
// Will return elements compressed with gzip if they're HTML, CSS, JS or JSON
app.use(compression());

// Add static middleware that handles serving up content from public directory
// The public directory will be served and any content in it will be available
// Request the root route '/' and you'll get index.html automatically
app.use(serveStatic(__dirname + '/public', { maxAge: oneDay }));
app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// Catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// Development error handler
// Will print stacktrace
if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: err
    });
  });
}

// Production error handler
// No stacktraces leaked to user
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: {}
  });
});















/* 
 * -------------
 * Yelp API call
 * -------------
 * set_parameters: object with params to search
 * callback: callback(error, response, body)
 */

var yelpCallback = function(error, response, body) {
  var yelp_response_data = JSON.parse(body);
  io.sockets.emit('yelp_response_data', yelp_response_data);
}

var requestYelp = function(set_parameters, pos, callback) {

  /* The type of request */
  var httpMethod = 'GET';

  /* The url we are using for the request */
  var url = 'http://api.yelp.com/v2/search';

  var lat = pos.lat;
  var lng = pos.lng;
  var yelpLatLng = lat+','+lng;

  /* We can setup default parameters here */
  var default_parameters = {
    ll: yelpLatLng,
    sort: '1' // 0=Best matched (default), 1=Distance, 2=Highest Rated
  };

  /* We set the require parameters here */
  var required_parameters = {
    oauth_consumer_key : process.env.YELP_CONSUMERKEY,
    oauth_token : process.env.YELP_TOKEN,
    oauth_nonce : n(),
    oauth_timestamp : n().toString().substr(0,10),
    oauth_signature_method : 'HMAC-SHA1',
    oauth_version : '1.0'
  };

  /* We combine all the parameters in order of importance */ 
  var parameters = _.assign(default_parameters, set_parameters, required_parameters);

  /* We set our secrets here */
  var consumerSecret = process.env.YELP_CONSUMERSECRET;
  var tokenSecret = process.env.YELP_TOKENSECRET;

  /* Then we call Yelp's Oauth 1.0a server, and it returns a signature */
  /* Note: This signature is only good for 300 seconds after the oauth_timestamp */
  var signature = oauthSignature.generate(httpMethod, url, parameters, consumerSecret, tokenSecret, { encodeSignature: false});

  /* We add the signature to the list of paramters */
  parameters.oauth_signature = signature;

  /* Then we turn the paramters object, to a query string */
  var paramURL = qs.stringify(parameters);

  /* Add the query string to the url */
  var apiURL = url+'?'+paramURL;

  /* Then we use request to send make the API Request */
  request(apiURL, function(error, response, body){
    return callback(error, response, body);
  });

};

module.exports = app;