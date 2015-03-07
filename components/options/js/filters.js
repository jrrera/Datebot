'use strict';

keywordsApp.filter('convertToPercent', function() {
	return function (float) {
		return parseInt(float*100);
	}
});