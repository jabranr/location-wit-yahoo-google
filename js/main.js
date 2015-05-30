!(function(root, $, factory)	{
	root.ExtractLocation = root.ExtractLocation || factory(root, $);

	$(document).ready(function() {
		$('#submit').on('click', function(e)	{
			return ExtractLocation.init( $('#query'), $('#output'), $(this) );
		});
	});


})(this, jQuery, function(root, $) {

	function makeQuery(query) {
		var select = 'SELECT * FROM geo.placemaker';
		var where = ' WHERE documentContent = "' + query + '"';
		var and = ' AND documentType = "text/plain"';
		return select + where + and;
	}

	function extractLocationData(data) {
		if ( data && data.match ) {
			var matches = data.match;

			if ( matches.length > 0 ) {
				for (var i = 0; i < matches.length; i++) {
					var match = matches[i];
					if (match.place) {
						app.foundLocations.push(match.place);
					}
				}
			}
			else {
				if (matches.place) {
					app.foundLocations.push(matches.place);
				}
			}
		}
	}

	var app = {
		foundLocations: [],
		yahooApi: 'https://query.yahooapis.com/v1/public/yql',

		init: function(query, output, submit) {
			if ( ! query.val().length ) return query.focus();
			var that = this;

			$.ajax({
			  url: that.yahooApi,
			  data: {
			    'q': makeQuery(query.val()),
			    'format': 'json'
			  },
			  method: 'GET',
			  success: function(data) {
			  	if (data) {

			  		if ( data.query && data.query.results && data.query.results.matches ) {
				  		extractLocationData(data.query.results.matches);
			  		}

		  			output.html(JSON.stringify(data, null, 4))
		  				.wrap( $('<pre />') );
		  		}
			  },
			  error: function(xhr, error) {
			  	output
			  		.html(JSON.stringify(xhr.responseJSON), null, 4)
			  		.wrap( $('<pre />', {
				  		'class': 'error'
				  	}) );
			  }
			});
		}

	};

	return app;
});

