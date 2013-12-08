'use strict';

dbotExtApp.controller('ProfileController', 
	function ProfileController($scope, $timeout, $filter, $log, ScraperData) {

		//Private variables
		var dayOfWeek = new Date().getDay();

		//Private functions within controller
		function processLineBreaks(text) {
		    var final = text.replace(/\s*<p[^>]+">\s*/gi,""); //Filters out all P tags
		    final = final.replace(/<\/?span[^>]*?"?>/gi,""); //Filters out all span tags
            final = final.replace(/\n*\s*<!--.*?-->\s*\n*/gi, ""); //Removes commented out HTML from Angular, in a nongreedy fashion
		    final = final.replace(/\s*<br\s?\/?>\s*\n*<\/p>\n*\s*/gi, "\n\n");
		    final = final.replace(/\s*<br\s?\/?>\s*/gi,"\n"); //Puts a line break for any <br> tag
		    final = final.replace(/\s*<\/p>\s*/gi,"\n\n"); //Adds two lines breaks for any closing p tags

		    return final;
		}

		function recordInteraction(interactionObj) {
			var records = localStorage["dbotInteractions"], //storage object containing username as key and interaction as value
			user = interactionObj.username;

			if (records) {
				//Parse JSON string and store this data if this user hasn't been recorded yet
				console.log('Found records. Parsing...');
				records = JSON.parse(records);
				if (!records[user]) records[user] = interactionObj;
				localStorage["dbotInteractions"] = JSON.stringify(records);
			} else {
				//If no records object found, intialize object, store data, and stringify
				console.log('no record found, adding...')
				records = {};
				records[user] = interactionObj;
				localStorage["dbotInteractions"] = JSON.stringify(records);
			}
			console.log(JSON.stringify(records, null, 4));
		}

		//Begin properties and methods available on scope
        $scope.loading = true; //Shows the AJAX loader graphic, and hides the results table. Will flip after AJAX call comes back
		$scope.foundKeywords = false; //Will flip to true upon locating stored keywords in Chrome's storage
		$scope.profiles = []; //Profile objects will be pushed here after processing.
		$scope.toggleMessaged = false; //Shows already-messaged results. Turned off by default
		$scope.customized = false; //Becomes true when you modify the textarea for custom messages
		$scope.saveCustomized = false; //Becomes true if $scope.customized is true AND you save
		$scope.customMessage = ""; //This part of the model will eventually contain the customized message
		$scope.recommendation = ""; //This will contain a recommendation based on calculate score
		
		//genericQuestion changes slightly depending on if it's a weekend (value of 0 or 6) or weekday (1-5), and is used if no interests are matched
		$scope.genericQuestion = (dayOfWeek === 0 || dayOfWeek === 6) ? "How's your weekend going?" : "How's your week going?";

		//Begin cascade of async calls for username, keywords, and profile
		$scope.initialize = function() {
			ScraperData.getKeywords($scope).then(function(data){
				$scope.keywords = data;

				//Now that keywords have been returned, time to get the profile
				//We pass in the scope since we need to run $scope.$apply in order for Angular to see that the response came back
				ScraperData.getProfile($scope).then(function(data){
					var html, jqueryArr, okcContext, profileObj;

					html = data.html;
					//console.log('The HTML is in the controller! Lets move on', html);
					
					//Returns an array of - in order - okcText, okcContext (for matched interests), the picture URL, and the jquery object
					jqueryArr = ScraperData.turnIntoJquery(html);

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
					console.log('Profile returned:', $scope.profiles);

				}, function(e){
					console.log(e);
					$scope.loading = false;
				});
			});
		};

		$scope.initialize(); //Initalizes the app

		//For the profile we're analyzing, this function calculates a score based on the priority rating of each matched keyword
		//A priority of 1 equates to 5 points; priority of 2 = 3 points; priority of 1 = 1 point. A score of 5 or higher is a winner.
		$scope.calculateScore = function(profile) {
			var score = 0;

			angular.forEach(profile.matches.matched, function(keyword, i){
				if (keyword.priority === "1") {
					score += 5;
				} else if (keyword.priority === "2") {
					score += 3;
				} else if (keyword.priority === "3") {
					score += 1;
				} else { //If no priority has been assigned, or it's the wrong data type, we give it a score of 1.
					score += 1;
				}				
			});
			
			//Now, we write out a custom recommendation message based on the calculated score.
			if (score > 10) {
				$scope.recommendation = "Damn. She's a winner!";
			} else if (score > 4) {
				$scope.recommendation = "A good match!";
			} else {
				$scope.recommendation = 'Meh.';
			}

 			return score;
		}

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

		$scope.sendToTab = function(profile){
			var message, interactionData;
			
			//If customized, $scope.customMessage from textarea is what's sent. Else, the standard .finalmessage div's contents are used
			message = $scope.saveCustomized ? $scope.customMessage : processLineBreaks($('.finalmessage').html());

			var portObj = {
			  message: message
			};

			//Send the message to the background script, and record the interaction if successful
			chrome.runtime.sendMessage({portover3: portObj}, function(response) {
				if (response.status === 'message_sent') {
					interactionData = document.getElementById(profile.okcUsername + '_data').textContent;
					recordInteraction(JSON.parse(interactionData));
				}
			});


		};

        //
		$scope.addTransitionText = function(index) {
            if (index === 1) {
                console.log($scope.keywords.first_transition + " ");
				return $scope.keywords.first_transition + " ";
			} else if (index > 1) {
                return $scope.keywords.second_transition + " ";			
			}
            return;
		};

        //Used to see how message will render after all HTML processing occurs. 
        $scope.testMessage = function() {
            return $scope.saveCustomized ? $scope.customMessage : processLineBreaks($('.finalmessage').html());
        }

		$scope.showCustomEditor = function(profile) {
			$scope.customMessage = processLineBreaks($('.finalmessage').html()); 
			var username = profile.okcUsername;
			profile.customEditorActive = true; //adds custom editor property to the profile model
		};

		//Function that runs as soon as the custom message textarea is edited
		$scope.markAsCustomized = function(profile) {
			$scope.customized = true; //Adds customized flag to the model
		};

		$scope.saveCustomEdit = function(profile) {
			profile.customEditorActive = false; //Turns off the custom editor
			if ($scope.customized) $scope.saveCustomized = true; //Becomes true if $scope.customized is true AND you save. This determines which div gets grabbed for sending the final message to the girl
		};

		$scope.goToOptions = function() {
			var extId = chrome.i18n.getMessage("@@extension_id"); //Gets the extension ID for opening the options page. Not required for creating the tab, but required for checking to see if the URL is open
			chrome.tabs.create({ 
			    url: "chrome-extension://" + extId + "/options/interests.html",
			    active: true
			});
		};

	}
);