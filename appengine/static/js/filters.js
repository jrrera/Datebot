'use strict';

scraperApp.filter('filterMessaged', function() {
	return function (profiles, value) {

		var matchedArr = [];

		// console.log('profiles', profiles);
		// console.log('value', value);
		
		//value is boolean based on whether "checked message" box is checked
		for (var i = 0; i < profiles.length; i++) {
			if (profiles[i].messaged && !value) {
				//console.log('do nothing');
			} else {
				matchedArr.push(profiles[i]);
			}			
		}

		return matchedArr;

	}
});
