'use strict';

angular.module('datebot').controller('ProfileController',
	function ProfileController($scope, ScraperService, TextProcessorService, StorageService) {
		var self = this;

		//Private variables
		var dayOfWeek = new Date().getDay(),
				profileObj = profileObj || {};

		//Begin properties and methods available on controller
    this.loading = true; //Shows the AJAX loader graphic, and hides the results table. Will flip after AJAX call comes back
		this.foundKeywords = false; //Will flip to true upon locating stored keywords in Chrome's storage
		this.profiles = []; //Profile objects will be pushed here after processing.
		this.toggleMessaged = false; //Shows already-messaged results. Turned off by default
		this.customized = false; //Becomes true when you modify the textarea for custom messages
		this.saveCustomized = false; //Becomes true if this.customized is true AND you save
		this.noTracking = false;
		this.customMessage = ""; //This part of the model will eventually contain the customized message
		this.recommendation = ""; //This will contain a recommendation based on calculate score

		//genericQuestion changes slightly depending on if it's a weekend (value of 0 or 6) or weekday (1-5), and is used if no interests are matched
		this.genericQuestion = (dayOfWeek === 0 || dayOfWeek === 6) ? "How's your weekend going?" : "How's your week going?";

		//Begin cascade of async calls for username, keywords, and profile
		this.initialize = function() {

			ScraperService.getKeywords().then(angular.bind(this, function(data) {

				this.keywords = data;

				if (ScraperService.foundKeywordsLocally) {
					this.foundKeywords = true;
				}

				//Now that keywords have been returned, time to get the profile
				ScraperService.getProfile().then(angular.bind(this, function(data){
					var basicData, okcContext, profileObj;

					// Returns an array of - in order - okcText,
					// okcContext (for matched interests), the picture URL,
					// and the jquery object
					basicData = ScraperService.extraBasicData(data.html);

					// Now, we test to see if the OKCText and username were found in the HTML.
					// If not, we're not on a profile page. If yes, continue on
					if (basicData.profile && basicData.username) {
						//Returns an array of objects (the essays scraped from the profile)
						okcContext = TextProcessorService.processContext(basicData.$html);

						//Processes the profile text with find-and-replace
						basicData.profile = TextProcessorService.processProfileText(basicData.profile);

						//Adds the okcContext as the fifth item in the basicData array
						basicData.context = okcContext;

						//Create the final profile object to send to the front-end if the profile processed successfully
						profileObj = {
							okcText: basicData.profile,
							okcUsername: basicData.username,
							okcPicture: basicData.imgUrl,
							okcContext: basicData.context,
							matches: ScraperService.findSimilarities(
									basicData.profile, this.keywords, basicData.context) //Generates the object that the Chrome extension front end looks for
						}

						this.profiles.push(profileObj);
					}

					this.loading = false;
					console.log('Profile returned:', this.profiles);

					// Before the initialization ends, we check if there is any custom message data to pull in:
					// If the last customized user matches who we just scraped, AND we find a customMessage along with it,
					// set the appropriate flags to restore the custom message
					if (localStorage["dbotCustomUser"] === this.profiles[0].okcUsername && localStorage["dbotCustomMessage"]) {
						console.log('Found a custom message! Restoring...');
						this.customized = true; //Adds customized flag to the model
						this.customMessage = localStorage["dbotCustomMessage"];
						this.saveCustomized = true;
					}

				}),
				angular.bind(this, function(e) {
					console.log(e);
					this.loading = false;
				})
			); // End inner async call

		})); // End outer async call
	};

		this.initialize(); //Initalizes the app

		//For the profile we're analyzing, this function calculates a score based on the priority rating of each matched keyword
		//A priority of 1 equates to 5 points; priority of 2 = 3 points; priority of 1 = 1 point. A score of 5 or higher is a winner.
		this.calculateScore = function(profile) {
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

			//Add the score to the model so that we can track it in the database
			profile.matchScore = score;

			//Now, we write out a custom recommendation message based on the calculated score.
			if (score > 10) {
				this.recommendation = "Damn. She's a winner!";
			} else if (score > 4) {
				this.recommendation = "A good match!";
			} else {
				this.recommendation = 'Meh.';
			}

 			return score;
		}

		// When the profiles model is updated by adjusting keyword choices,
		// customized becomes false again and we keep the message model in sync.
		this.keywordClick = function(){
			//Reset the customized message flags
			this.customized = false;
			this.saveCustomized = false;

			//Reset localStorage for custom messages
			localStorage["dbotCustomMessage"] = null;
			localStorage["dbotCustomUser"] = null;

			//Update the textarea message model
			this.customMessage = TextProcessorService.processLineBreaks(
					$('.finalmessage').html());
		};

		this.raiseKeywordPosition = function(clickedMatch, matchesArr, top) {
			//This function moves a particular keyword one slot higher for arranging your message.
			var thisPosition, thisObject, prevObject;
			thisPosition = matchesArr.indexOf(clickedMatch);
			thisObject = clickedMatch;
			prevObject = matchesArr[thisPosition-1];

			//If we want to move to top, execute differently vs. moving up one position
			if (top) {
				matchesArr.splice(thisPosition,1); //Remove from current position
				matchesArr.unshift(thisObject); //Moves item to top of array
			} else {
				matchesArr[thisPosition] = prevObject;
				matchesArr[thisPosition-1] = thisObject;
			}

		};

		this.lowerKeywordPosition = function(clickedMatch, matchesArr, bottom) {
			//This function moves a particular keyword one slot higher for arranging your message.
			var thisPosition, thisObject, nextObject;

			thisPosition = matchesArr.indexOf(clickedMatch);
			thisObject = clickedMatch;
			nextObject = matchesArr[thisPosition+1];

			//If we want to move to bottom, execute differently vs. moving down one position
			if (bottom) {
				matchesArr.splice(thisPosition, 1);
				matchesArr.push(thisObject);
			} else {
				matchesArr[thisPosition] = nextObject;
				matchesArr[thisPosition+1] = thisObject;
			}
		};

		this.copyToClipboard = function(profile){
			document.execCommand('copy'); // Copy to clipboard.
		};

    // This function is used for debugging purposes
    // In particular, to see how message will render after all HTML processing occurs.
    this.testMessage = function() {
    	// Either return customized message with linebreaks turned into <br> tags, if customization had been used
    	// or process the keyword generated message and replace linebreaks similarly
        return this.saveCustomized ? this.customMessage.replace(/\n/g, '<br />') : TextProcessorService.processLineBreaks($('.finalmessage').html()).replace(/\n/g, '<br />');
    }

		this.showCustomEditor = function(profile) {
			//If there is no customized message already, grab the keyword-driven message and convert
			//If we've already customized, this just pulls it as it is without overwriting
			if (!this.saveCustomized) {
				this.customMessage = TextProcessorService.processLineBreaks($('.finalmessage').html());
			}
			profile.customEditorActive = true; //adds custom editor property to the profile model
		};

		//Function that runs as soon as the custom message textarea is edited
		this.markAsCustomized = function(profile) {
			this.customized = true; //Adds customized flag to the model
		};

		this.saveCustomEdit = function(profile) {
			profile.customEditorActive = false; //Turns off the custom editor
			if (this.customized) {
				// This flag becomes true if this.customized is true AND you save.
				// This determines which div gets grabbed for sending the final message to the girl
				this.saveCustomized = true;

				// Next, we save to localStorage, that way if you leave the app temporarily,
				// And rescan the same girl, the custom message will be there waiting for you
				localStorage["dbotCustomUser"] = profile.okcUsername;
				localStorage["dbotCustomMessage"] = this.customMessage;
			}
		};

		this.goToOptions = function() {
			var extId = chrome.i18n.getMessage("@@extension_id"); //Gets the extension ID for opening the options page. Not required for creating the tab, but required for checking to see if the URL is open
			chrome.tabs.create({
			    url: "chrome-extension://" + extId + "/components/options/interests.html",
			    active: true
			});
		};


		this.confirmCopied = function() {
			self.copied = true;

			setTimeout(function() {
				self.copied = false;
				$scope.$evalAsync();
			}, 3000);
		};

		// This function on the controller updates the profileObj in place withour returning a new object
		// profileObj is a private var in the controller, to allow it to maintain state between function calls
		// By updating the object in place, we avoid infinite digest loops by returning new object in each call
		this.updateDatabaseObj = function (profileObj, customizedBool, username, matchScore) {
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

			profileObj.keywords = produceKeywordArr(profileObj.matched);
			profileObj.username = username;
			profileObj.date_messaged = new Date;
			profileObj.customized = customizedBool;
			profileObj.response = false;
			profileObj.opener = profileObj.opener.replace(/(?:\n|<br\s?\/?>)/gi, ""); //Removes line breaks and br tags from record
			profileObj.closer = profileObj.closer.replace(/(<br\s?\/?>)/gi, "\n");
			profileObj.matchScore = matchScore;

			return profileObj;
		}

	}
);
