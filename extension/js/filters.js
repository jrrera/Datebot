'use strict';

dbotExtApp.filter('filterForDatabase', function() {
	return function (profileObj) {

		function produceKeywordObj(matchArr) {
			//Takes in the 'matched' array, and processes it to return the required keyword-specific object that the server looks for. (keyword and position in message, i.e. {'running': 1})
			var keywordObj = {}, counter = 0;
			angular.forEach(matchArr, function(match){
				if (match.checked) keywordObj[match.keyword] = counter++ + 1; //Add one to index to signify position of keyword used when messaging, assuming it was used in the message, and then increments the counter
			}); 
			return keywordObj;
		}
		
		//console.log('profileObj', profileObj);
		var babeObj = {}, d = new Date, curr_date = d.getDate(), curr_month = d.getMonth() + 1, //Months are zero based
		curr_year = d.getFullYear(), dateFormatted = curr_year + "-" + curr_month + "-" + curr_date;

		babeObj.keywords = produceKeywordObj(profileObj.matched);
		babeObj.username = undefined; //This will get added by the chrome extension
		babeObj.date_messaged = dateFormatted;
		babeObj.customized = false; //Will need to customize this later. Once we add functionality for it, that is.
		babeObj.opener = profileObj.opener;
		babeObj.closer = profileObj.closer;
		
		return babeObj;

	}
});