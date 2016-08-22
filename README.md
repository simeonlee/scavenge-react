# ![alt text][logo] Scavenge

It's 2016 and healthy eating is in. If you're craving beautiful Instagram salads and Instagram green juices but the people in your feed are nowhere near you, how are you going to live your Instagram-worthy life? Instead of sifting through pages of Yelp reviews to find snacks worthy of your mouth, let Scavenge do the legwork!

[Scavenge][site] changes your life by serving up Instagram pics related to healthy eating on a map of your neighborhood with no clicking required. Immediately see what people in your current area are posting pics of and how far away they are!

Then, after you get your [sweetgreen][sweetgreen], search for any other topic all over the world!

### Resources

Given that Instagram has restricted their API ([requiring a review process][instagram]), the Scavenge app accesses the [Twitter API][twitter] for recent, nearby tweets and pulls image metadata from embedded links. [Google's API][google] was used for the map and location search. The application uses [Node.js][node] and is hosted using [Heroku][heroku]. SSL certification is required as Chrome [recently deprecated][deprecated] geolocation on http (now restricted to https).

### What's Next

* Walkthrough for first time visitors to the app
* Ability to drag or click the map to initiate a new search
* User login support so that pics can be 'favorited' and customized queries persist
* Display pics in a grid or stream either off to the side or on another page a la Flow or TweetDeck
* Support other types of content besides Instagram pics (blog post snippets, recipes, site thumbnails)
* Intertwine Yelp, Foursquare and/or Google Places API data so that each Instagram pic is accompanied by deeper contextual data (ratings, review counts, related images)
* Live API updates
* Responsive CSS for phone and tablet devices
* Provide 'recommended' queries such as 'politics', 'trending', 'fitness', etc.

### Author

Scavenge was built by [Simeon Lee][linkedin].

[logo]: https://github.com/simeonlee/scavenge/blob/master/public/images/scavengebird%402x.png "Scavenge logo"
[site]: https://www.scavenge.io "Scavenge site"
[sweetgreen]: https://twitter.com/sweetgreen "sweetgreen twitter"
[instagram]: https://www.instagram.com/developer "Instagram API"
[twitter]: https://dev.twitter.com "Twitter API"
[google]: https://developers.google.com/maps "Google API"
[node]: https://nodejs.org "Node.js"
[heroku]: https://www.heroku.com "Heroku"
[deprecated]: https://developers.google.com/web/updates/2016/04/geolocation-on-secure-contexts-only "Deprecated"
[hackreactor]: http://www.hackreactor.com "Hack Reactor"
[linkedin]: https://www.linkedin.com/in/simeonhlee "LinkedIn profile"