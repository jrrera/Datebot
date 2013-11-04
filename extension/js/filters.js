'use strict';

dbotExtApp.filter('filterForDatabase', function() {
	return function (profileObj, customizedBool, username) {

		function produceKeywordArr(matchArr) {
			//Takes in the 'matched' array and returns an array of keywords used, in the order of their use
			var keywordArr = [];
			if (matchArr.length) {
				angular.forEach(matchArr, function(match){
					if (match.checked) keywordArr.push(match.keyword); 
				}); 
			} else {
				keywordArr.push('genericQuestion'); //If no matches found in the matchArr, record a generic message
			}

			if (!keywordArr.length) keywordArr.push('genericQuestion'); //If matchArr has interests, but none were checked when messsage was sent, record as generic message
			return keywordArr;
		}

		var babeObj = {}, d = new Date, curr_date = d.getDate(), curr_month = d.getMonth() + 1, //Months are zero based
		curr_year = d.getFullYear(), dateFormatted = curr_year + "-" + curr_month + "-" + curr_date;

		babeObj.keywords = produceKeywordArr(profileObj.matched);
		babeObj.username = username;
		babeObj.date_messaged = dateFormatted;
		babeObj.customized = customizedBool; 
		babeObj.opener = profileObj.opener.replace(/(?:\n|<br\s?\/?>)/gi, ""); //Removes line breaks and br tags from record
		babeObj.closer = profileObj.closer.replace(/(<br\s?\/?>)/gi, "\n");
		
		return babeObj;
	}
});

dbotExtApp.filter('replaceLineBreaks', function() {
	return function (message) {
		return message.replace(/\n/g, "<br />");
	}
});