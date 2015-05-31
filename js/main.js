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

	function render(input) {
		return $('#output')
			.empty()
			.html(JSON.stringify(input, null, 4))
			.wrap( $('<pre />', { 'class': 'error' }) );
	}

	function renderAppend(input) {
		var $output = $('#output');
		var $html = $output.html();
		return $output
			.html($html + '\r\n' + JSON.stringify(input, null, 4));
	}

	var app = {
		foundLocations: {},
		errorLog: [],
		yahooApi: 'https://query.yahooapis.com/v1/public/yql',
		witAppId: '5555fe3b-a58f-44cc-8689-92daec576492',
		witToken: 'EEOSBAWMRZVQUMEIKCBAR2V6UWLNMWBW',
		witApi: 'https://api.wit.ai/message',
		witVersion: '20150515',

		extractLocationData: function(data) {
			var self = app;

			// result from yahoo
			if ( data.query ) {
				if ( data.query.results && data.query.results.matches && data.query.results.matches.match ) {
					var matches = data.query.results.matches.match;

					if ( matches.length > 0 ) {
						for (var i = 0; i < matches.length; i++) {
							var match = matches[i];
							if (match.place) {
								self.foundLocations.yahoo = match.place;
							}
						}
					}
					else {
						if (matches.place) {
							self.foundLocations.yahoo = matches.place;
						}
					}
				}
				else {
					self.errorLog.push({
						yahoo: data
					});
				}
			}

			// result from wit
			if ( data.msg_id ) {
				if ( data.outcomes ) {

					var matches = data.outcomes;

					for (var i = 0; i < matches.length; i++) {
						var match = matches[i];
						if ( match.intent && match.intent === 'location' ) {
							if (match.entities && match.entities.location) {
								self.foundLocations.wit = match.entities.location;
							}
							else {
								self.errorLog.push({
									wit: data
								});
							}
						}
					}

					self.googleLocationData();
				}
				else {
					self.errorLog.push({
						wit: data
					});
				}
			}
		},

		googleLocationData: function() {
			if ( ! app.foundLocations ) return;
			var data = app.foundLocations;
			var wit;

			for (var key in data) {
				if ( data.hasOwnProperty(key) && key === 'wit' ) {
					wit = data[key];
				}
			}

			if ( wit ) {
				wit.map(app.geocodeWitLocation);
			}
		},

		geocodeWitLocation: function(data) {
			if ( ! data || ! data.value ) return;
			if ( ! typeof google === 'undefined' )
				throw new Error('Google Maps API SDK are not loaded.');

			app.foundLocations.google = app.foundLocations.google || [];
			var geocoder = new google.maps.Geocoder();
			geocoder.geocode({
				address: data.value
			}, function(results, status) {
				if (status === google.maps.GeocoderStatus.OK) {
					var result = results[0];

					app.foundLocations.google.push({
						_data: result,
						address: result.formatted_address,
						accuracy: result.partial_match ? 'partial' : 'exact',
						position: {
							lat: result.geometry.location.lat(),
							lng: result.geometry.location.lng()
						}
					});

					render(app.foundLocations);
				}
			});
		},

		init: function(query, output, submit) {
			if ( ! query.val().length ) return query.focus();
			this.query = query;
			var self = this;

			$.when(
				$.ajax({
					url: self.yahooApi,
					method: 'GET',
					data: {
						q: makeQuery(self.query.val()),
						format: 'json'
					}
				}),
				$.ajax({
					url: self.witApi,
					method: 'GET',
					dataType: 'jsonp',
					data: {
						q: self.query.val(),
						v: self.witVersion,
						access_token: self.witToken
					}
				})
			).then(
				function(yahoo, wit) {
					self.extractLocationData(yahoo[0]);
					self.extractLocationData(wit[0]);

					if ( self.errorLog.length ) {
						render(self.errorLog);
					}

					if ( self.foundLocations ) {
						render(self.foundLocations);
					}
				},
				function(xhr, error) {
					render(error);
				}
			);
		},

		isArray: function(obj) {
			return (Object.prototype.toString.call(obj) === '[objcet Array]');
		}

	};

	return app;
});

