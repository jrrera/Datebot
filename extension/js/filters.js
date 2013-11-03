'use strict';

dbotExtApp.filter('filterForDatabase', function() {
	return function (profileObj, customizedBool, username) {

		function produceKeywordObj(matchArr) {
			//Takes in the 'matched' array and returns it in the required format (keyword and position in message, i.e. {'running': 1})
			var keywordObj = {}, counter = 0;
			angular.forEach(matchArr, function(match){
				if (match.checked) keywordObj[match.keyword] = counter++ + 1; //Add one to index to signify position of keyword used when messaging, assuming it was used in the message, and then increments the counter
			}); 
			return keywordObj;
		}

		var babeObj = {}, d = new Date, curr_date = d.getDate(), curr_month = d.getMonth() + 1, //Months are zero based
		curr_year = d.getFullYear(), dateFormatted = curr_year + "-" + curr_month + "-" + curr_date;

		babeObj.keywords = produceKeywordObj(profileObj.matched);
		babeObj.username = username;
		babeObj.date_messaged = dateFormatted;
		babeObj.customized = customizedBool; 
		babeObj.opener = profileObj.opener;
		babeObj.closer = profileObj.closer;
		
		return babeObj;
	}
});

dbotExtApp.filter('replaceLineBreaks', function() {
	return function (message) {
		//console.log('triggering replaceLineBreaks filter');
		return message.replace(/\n/g, "<br />");
	}
});