'use strict';

dbotExtApp.controller('ProfileController', 
	function ProfileController($scope, $timeout, $filter, $log, ScraperData) {

		function processLineBreaks(text) {
			//console.log('text prior to processing', text);
		    var final = text.replace(/\s*<p[^>]+">\s*/gi,""); //Filters out all P tags
		    final = final.replace(/\n*\s*<!--.*-->\s*\n*/gi, ""); //Removes commented out HTML from Angular
		    final = final.replace(/\s*<br\s?\/?>\s*\n*<\/p>\n*\s*/gi, "\n\n");
		    final = final.replace(/\s*<br\s?\/?>\s*/gi,"\n"); //Puts a line break for any <br> tag
		    final = final.replace(/\s*<\/p>\s*/gi,"\n\n"); //Adds two lines breaks for any closing p tags
		    return final;
		}

		$scope.loading = true; //Shows the AJAX loader graphic, and hides the results table. Will flip after AJAX call comes back
		$scope.username = ScraperData.getUsername();
		$scope.profiles = []; //Profile objects will be pushed here after processing.
		$scope.toggleMessaged = false; //Shows already-messaged results. Turned off by default
		$scope.customized = false; //Becomes true when you modify the textarea for custom messages
		$scope.saveCustomized = false; //Becomes true if $scope.customized is true AND you save
		$scope.customMessage = ""; //This part of the model will eventually contain the customized message
		
		$scope.keywords = ScraperData.getKeywords("jrrera@gmail.com"); //This may need to be put inside ScraperData.getProfiles.then() since this will also be async once calling from database
		
		ScraperData.getProfile($scope).then(function(data){
			var html, jqueryArr, okcContext, profileObj;
			//We pass in the scope since we need to run $scope.apply in order for Angular to see that the response came back from Chrome extension

			html = data.html;
			console.log('The HTML is in the controller! Lets move on', html);
			
			//Returns an array of - in order - okcText, okcContext (for matched interests), the picture URL, and the jquery object
			jqueryArr = ScraperData.turnIntoJquery(html);

			//console.log(jqueryArr);

			//Now, we test to see if the OKCText and username were found in the HTML. If not, we're not on a profile page. If yes, continue on
			if (jqueryArr[0] && jqueryArr[1]) {
				//Returns an array of objects (the essays scraped from the profile)
				okcContext = ScraperData.processContext(jqueryArr[3]);

				//Processes the profile text with find-and-replace
				jqueryArr[0] = ScraperData.processProfileText(jqueryArr[0]); 

				//Adds the okcContext as the fifth item in the jqueryArr array
				jqueryArr.push(okcContext);

				//Create the final profile object to send to the front-end if the profile processed successfully
				profileObj = {
					okcText: jqueryArr[0],
					okcUsername: jqueryArr[1],
					okcPicture: jqueryArr[2],
					okcContext: jqueryArr[4],
					matches: ScraperData.findSimilarities(jqueryArr[0], $scope.keywords, jqueryArr[4]) //Generates the object that the Chrome extension front end looks for
				}
				
				$scope.profiles.push(profileObj);
			}

			$scope.loading = false;
			console.log($scope.profiles);

		}, function(e){
			console.log(e);
			$scope.loading = false;
		});
		
		//When the profiles model is updated by adjusting keyword choices, customized becomes false again and we keep the message model in sync.
		$scope.keywordClick = function(){
			//Reset the customized message flags
			$scope.customized = false;
			$scope.saveCustomized = false;

			//Update the textarea message model
			$scope.customMessage = processLineBreaks($('.finalmessage').html());
			//console.log('customMessage model is now', $scope.customMessage);
		};

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
			
			//If customized, $scope.customMessage from textarea is what's sent. Else, the standard .finalmessage div's contents are used
			message = $scope.saveCustomized ? $scope.customMessage : processLineBreaks($('.finalmessage').html());

			//$scope.testmessage = message; //for testing
			//console.log('processLinebreaks message after processing is', message);

			var portObj = {
			  message: message
			};

			//Send the message to the background script
			chrome.runtime.sendMessage({portover3: portObj}, function(response) {});


		};

		$scope.showCustomEditor = function(profile) {
			$scope.customMessage = processLineBreaks($('.finalmessage').html()); 
			var username = profile.okcUsername;
			profile.customEditorActive = true; //adds custom editor property to the profile model
		};

		//Function that runs as soon as the custom message textarea is edited
		$scope.markAsCustomized = function(profile) {
			$scope.customized = true; //Adds customized flag to the model
		}

		$scope.saveCustomEdit = function(profile) {
			profile.customEditorActive = false; //Turns off the custom editor
			if ($scope.customized) $scope.saveCustomized = true; //Becomes true if $scope.customized is true AND you save. This determines which div gets grabbed for sending the final message to the girl
		}

	}
);