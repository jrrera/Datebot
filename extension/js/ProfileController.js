'use strict';

dbotExtApp.controller('ProfileController', 
	function ProfileController($scope, $timeout, $filter, $log, ScraperData) {

		function processLineBreaks(text) {
		    var final = text.replace(/\s*<p[^>]+">\s*/gi,""); //Filters out all P tags
		    final = final.replace(/\s*<br\s?\/?>\s*/gi,"\n"); //Puts a line break for any <br> tag
		    final = final.replace(/\s*<\/p>\s*/gi,"\n\n"); //Adds two lines breaks for any closing p tags
		    final = final.replace(/<!--.*-->/gi, ""); //Removes commented out HTML from Angular
		    return final;
		}

		$scope.loading = true; //Shows the AJAX loader graphic, and hides the results table. Will flip after AJAX call comes back
		$scope.username = ScraperData.getUsername();
		$scope.profiles = []; //Profile objects will be pushed here after processing.
		$scope.toggleMessaged = false; //Shows already-messaged results. Turned off by default
		
		$scope.keywords = ScraperData.getKeywords("jrrera@gmail.com"); //This may need to be put inside ScraperData.getProfiles.then() since this will also be async once calling from database
		
		ScraperData.getProfile($scope).then(function(data){
			var html, jqueryArr, okcContext, profileObj;
			//We pass in the scope since we need to run $scope.apply in order for Angular to see that the response came back from Chrome extension

			html = data.html;
			console.log('The HTML is in the controller! Lets move on', html);
			
			//Returns an array of - in order - okcText, okcContext (for matched interests), the picture URL, and the jquery object
			jqueryArr = ScraperData.turnIntoJquery(html);

			//Returns an array of objects (the essays scraped from the profile)
			okcContext = ScraperData.processContext(jqueryArr[3]);

			//Processes the profile text with find-and-replace
			jqueryArr[0] = ScraperData.processProfileText(jqueryArr[0]); 

			//Adds the okcContext as the fifth item in the jqueryArr array
			jqueryArr.push(okcContext);

			//Create the final profile object to send to the front-end
			profileObj = {
				okcText: jqueryArr[0],
				okcUsername: jqueryArr[1],
				okcPicture: jqueryArr[2],
				okcContext: jqueryArr[4],
				matches: ScraperData.findSimilarities(jqueryArr[0], $scope.keywords, jqueryArr[4]) //Generates the object that the Chrome extension front end looks for
			}
			
			$scope.profiles.push(profileObj);
			$scope.loading = false;

			console.log('$scope.profiles is defined as:', $scope.profiles);
		}, function(e){
			console.log(e);
			$scope.loading = false;
		});

		$scope.raiseKeywordPosition = function(clickedMatch, matchesArr) {
			//This function moves a particular keyword one slot higher for arranging your message. 
			var thisPosition, thisObject, prevObject;
			
			thisPosition = matchesArr.indexOf(clickedMatch);
			thisObject = clickedMatch;
			prevObject = matchesArr[thisPosition-1];

			matchesArr[thisPosition] = prevObject;
			matchesArr[thisPosition-1] = thisObject;
		};

		$scope.lowerKeywordPosition = function(clickedMatch, matchesArr) {
			//This function moves a particular keyword one slot higher for arranging your message. 
			var thisPosition, thisObject, nextObject;
			
			thisPosition = matchesArr.indexOf(clickedMatch);
			thisObject = clickedMatch;
			nextObject = matchesArr[thisPosition+1];

			matchesArr[thisPosition] = nextObject;
			matchesArr[thisPosition+1] = thisObject;
		};

		$scope.sendToTab = function(){
			var message, user, databaseData;
			
			message = processLineBreaks($('.finalmessage').html());
			console.log('processLinebreaks message after processing is', message);

			var portObj = {
			  message: message
			};

			//Send the message to the background script
			chrome.runtime.sendMessage({portover3: portObj}, function(response) {});


		};

	}
);