'use strict';

// A simple filter to replace line breaks with HTML when necessary
angular.module('dbotExtApp').filter('replaceLineBreaks', function() {
	return function (message) {
		return message.replace(/\n/g, "<br />");
	}
});

// This filter is used when we need to display HTML that is stored on the $scope object
angular.module('dbotExtApp').filter('unsafe', function($sce) {
    return function(val) {
        return $sce.trustAsHtml(val);
    };
});

// This filter lowercases the first letter of the first paragraph of an interest message 
// if a transition is present.
angular.module('dbotExtApp').filter('adjustCapitalLetters', function() {
	return function(message, index, keywords) {
		// If the index of the message is over zero, check to see if the relevant transition is present. 
		// If so, adjust lowercase the first letter, but only if not leading with "I", "I'm", "I'll", etc.
		// which should obviously stay capitalized.
		if (index === 1 && keywords.first_transition && message.slice(0,2) !== "I " && message.slice(0,2) !== "I'") {
			return message[0].toLowerCase() + message.slice(1);
		} else if (index > 1 && keywords.second_transition && message.slice(0,2) !== "I " && message.slice(0,2) !== "I'") {
			return message[0].toLowerCase() + message.slice(1);
		}
		return message; //Return message unfiltered if doesn't meet criteria
	}
});