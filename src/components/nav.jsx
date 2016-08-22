module.exports = () => (
  <div className="nav">
	  <input className="search search-query" type="text" placeholder="Query" />
	  <div className="logo logo-container">
		  <div className="logo logo-image">
			  <img src={require('../images/scavengebird@2x.png')} />
		  </div>
	    <span className="logo logo-text">scavenge</span>
	  </div>
	  <input className="search" id="google-search" type="text" placeholder="Location" />
  </div>
)