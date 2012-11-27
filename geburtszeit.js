var options = {
	"apikey": "b09f0e1163a77b314c56ee3f6b788379fda54bc17413e78a59dd",
	"endpoint": "http://api.zeit.de/content"
}

function chooseResult( matches ) {
	_.shuffle( matches );
	var storys = _.reject( matches, function( match ) {
		return match.subtitle == null;
	});
	if ( storys.length < 3 ) {
		storys = storys.concat( matches.slice( 0, 3-storys.length ) );
	}
	else {
		storys = storys.slice( 0, 3 );
	}
	console.log( storys );
	return storys;
}

function setFields( results ) {
	var title = results[0];
	var bigstory = results[1];
	var lilstory = results[2];
	var $hero = $( "#hero" );

	$( "#hero .title").text( title.title );
	$( "#hero .subtitle" ).text( title.subtitle );

	//set image for hero
	//get something from title
	var words = title.title.split( " " );
	var noun_verb = null;
	for ( var i = 0; i <= words.length; i++ ) {
		var word = words[ i ];
		console.log( word );
		var firstchar = word.charAt( 0 );
		if ( firstchar === firstchar.toUpperCase() ) {
			//firstchar is uppercase, indicating a noun
			//check with stopword list
			if ( !_.contains( Stopwords.German, word.toLowerCase() ) ) {
				noun_verb = word;
				break;
			}
		}
	}
	if ( noun_verb === null ) {
		//everything in the title is a stop word?
		word = words[0];
	}

	RandomFlickr.get( word, function( url ) {
		$hero.css( "background-image", "url("+url+")" );
	},
	{
		size: [ $hero.width(), $hero.height() ]
	});

	$( "#bigstory .title" ).text( bigstory.title );
	$( "#bigstory .subtitle" ).text( bigstory.subtitle );

	$( "#lilstory .title" ).text( lilstory.title );
	$( "#lilstory .subtitle" ).text( lilstory.subtitle );

}

function clearFields() {
	$( "#messages" ).empty();
	$( "#title" ).empty();
	$( "#subtitle" ).empty();
	$( "#supertitle" ).empty();
	$( "#results" ).fadeOut();
}

$( document ).ready( function() {
	var $spinner = $( "#spinner" );
	var $results = $( "#results" );
	var $messages = $( "#messages" );

	//load datepicker
	var input = $( "#date" ).pickadate({
		first_day: 1,
		month_selector: true,
		format_submit: "yyyy-mm-dd",
		year_selector: 100,
		weekdays_short: [ 'So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa' ],
		months_full: [ 'Januar', 'Februar', 'März', "April", 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember' ],
		format: 'ddd, dd.mm.yyyy',
		date_max: true,
		date_min: [ 1946, 1, 1 ]
	});
	var calendar = input.data( 'pickadate' );

	calendar.setDate( 1954, 11, 16 );

	//init button event handler
	$( "#load" ).click( function( ) {

		clearFields();

		var day = calendar.getDate();
		var date = new Date( day );
		var to = date.toISOString().slice( 0, 10 ) + "T23:59:59Z";
		var from = date.toISOString().slice( 0, 10 ) + "T00:00:00Z";

		console.log( date );

		if ( date.getFullYear() < 2000 ) {
			// pre zeit online
			//search in past week
			var daysback = ( date.getDate() - 7 );
			var new_from = new Date( date.getFullYear(), date.getMonth(), daysback );
			from = new_from.toISOString().slice( 0, 10 ) + "T00:00:00Z";
		}		

		console.log( from, to );

		$spinner.show( 200 );
		$.ajax( { 
			"url": options.endpoint,
			"method": "GET",
			"data":	{ 
				"q": "release_date:[" + from + " TO " + to + "]",
				"sort": "release_date asc",
				"limit": 100
			},
			beforeSend: function( req ) {
				req.setRequestHeader( "X-Authorization", options.apikey );
			}
		}).done( function( response ) {
			$spinner.hide( 200 );
			console.log( response );

			if ( response.found === 0 ) {
				var moment_from = moment( from );
				var moment_to = moment( to );
				var format = "D.M.YYYY";
				$messages.text( "Leider wurde keine Ausgabe der ZEIT im Zeitraum " + moment_from.format( format ) + " - " + moment_to.format( format ) + " gefunden." );
			}
			else {
				var result = response.matches[ 0 ];

				setFields( chooseResult( response.matches ) );

				$results.fadeIn( 200 );
			}
		});
	});
});