'use strict';

scraperApp.filter('testFilter', function() {
	return function (input) {
		return input.toUpperCase();
	}
});
