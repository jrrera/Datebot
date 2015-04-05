'use strict';

angular.module('datebot').controller('ProfileController', 
	function ProfileController(ScraperService, TextProcessorService, MatchService) {

		//Private variables
		var dayOfWeek = new Date().getDay(),
			  babeObj = babeObj || {}; 

		function recordInteraction() {
			var records = localStorage["dbotInteractions"], //storage object containing username as key and interaction as value
			interactionObj = babeObj, //grabs the variable off the controller
			user = interactionObj.username;

			if (records) {
				//Parse JSON string and store this data if this user hasn't been recorded yet
				console.log('Found records. Parsing...');
				records = JSON.parse(records);
				if (!records[user]) records[user] = interactionObj;
				localStorage["dbotInteractions"] = JSON.stringify(records);
			} else {
				//If no records object found, intialize object, store data, and stringify
				console.log('No interaction record found, adding...');
				records = {};
				records[user] = interactionObj;
				localStorage["dbotInteractions"] = JSON.stringify(records);
			}
			//console.log(JSON.stringify(records, null, 4));
		}

		//Begin properties and methods available on controller
    this.loading = true; //Shows the AJAX loader graphic, and hides the results table. Will flip after AJAX call comes back
		this.foundKeywords = false; //Will flip to true upon locating stored keywords in Chrome's storage
		// this.profiles = []; //Profile objects will be pushed here after processing.
		this.toggleMessaged = false; //Shows already-messaged results. Turned off by default
		this.customized = false; //Becomes true when you modify the textarea for custom messages
		this.saveCustomized = false; //Becomes true if this.customized is true AND you save
		this.noTracking = false;
		this.customMessage = ""; //This part of the model will eventually contain the customized message
		this.recommendation = ""; //This will contain a recommendation based on calculate score
		
		//genericQuestion changes slightly depending on if it's a weekend (value of 0 or 6) or weekday (1-5), and is used if no interests are matched
		this.genericQuestion = (dayOfWeek === 0 || dayOfWeek === 6) ? 
															"How's your weekend going?" : 
															"How's your week going?";

		//Begin cascade of async calls for username, keywords, and profile
		this.initialize = function() {
			ScraperService.getKeywords().then(angular.bind(this, function(data) {

				this.keywords = data;

				if (ScraperService.foundKeywordsLocally) {
					this.foundKeywords = true;
				}

				//Now that keywords have been returned, time to get the profile
				ScraperService.getProfile().then(angular.bind(this, function(data) {
					var htmlDataObj = ScraperService.turnIntoJquery(data.html);

					// Object exposed to the front end.  
					this.profile = TextProcessorService.convertHtmlDataToProfile(
							htmlDataObj, this.keywords);

					this.profile.matchScore = MatchService.calculateMatchScore(this.profile);
					this.profile.recommendation = MatchService.getRecommendation(this.profile.matchScore);

					this.loading = false;

					// Restore any locally stored data if you viewed this profile last time.
					if (localStorage["dbotCustomUser"] === this.profile.okcUsername && localStorage["dbotCustomMessage"]) {
						console.log('Found a custom message! Restoring...');
						this.customized = true; //Adds customized flag to the model
						this.customMessage = localStorage["dbotCustomMessage"];
						this.saveCustomized = true;
					}

				}), 
				angular.bind(this, function errorHandler(e) {
					console.log(e);
					this.loading = false;
				})
			); // End inner async call
		})); // End outer async call
	};

	this.initialize(); //Initalizes the app


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

	// TODO(jon): Merge the two functions below
	this.raiseKeywordPosition = function(clickedMatch, matchesArr) {
		//This function moves a particular keyword one slot higher for arranging your message. 
		var thisPosition, thisObject, prevObject;
		thisPosition = matchesArr.indexOf(clickedMatch);
		thisObject = clickedMatch;
		prevObject = matchesArr[thisPosition-1];

		matchesArr[thisPosition] = prevObject;
		matchesArr[thisPosition-1] = thisObject;	

		this.keywordClick(); // This is essentially a keyword "click".		
	};

	this.lowerKeywordPosition = function(clickedMatch, matchesArr) {
		// This function moves a particular keyword one slot higher for arranging 
		// your message. 
		var thisPosition, thisObject, nextObject;
		
		thisPosition = matchesArr.indexOf(clickedMatch);
		thisObject = clickedMatch;
		nextObject = matchesArr[thisPosition+1];

		// If we want to move to bottom, execute differently vs. moving down one 
		// position.
		matchesArr[thisPosition] = nextObject;
		matchesArr[thisPosition+1] = thisObject;

		this.keywordClick(); // This is essentially a keyword "click".
	};

	this.sendToTab = function(profile){
		var message, interactionData;
		
		//If customized, this.customMessage from textarea is what's sent. 
		// Else, the standard .finalmessage div's contents are used
		message = this.saveCustomized 
									? this.customMessage 
									: TextProcessorService.processLineBreaks(
												$('.finalmessage').html());

		console.log(ScraperService.userId);
		var portObj = {
		  message: message,
		  userId: ScraperService.userId
		};

		//Send the message to the background script & record the interaction
		chrome.runtime.sendMessage({portover3: portObj}, function(response) {
			if (response.status === 'message_sent' && !this.noTracking) {
				console.log('Recording interaction!');
				recordInteraction();
			}
		});
	};
	
  // This function is used for debugging purposes
  // In particular, to see how message will render after all HTML processing occurs. 
  this.testMessage = function() {
  	// Either return customized message with linebreaks turned into <br> tags, if customization had been used
  	// or process the keyword generated message and replace linebreaks similarly
    return this.saveCustomized ? 
    		this.customMessage.replace(/\n/g, '<br />') : 
    		TextProcessorService.processLineBreaks(
						$('.finalmessage').html()).replace(/\n/g, '<br />');
  };

	this.showCustomEditor = function(profile) {
		//If there is no customized message already, grab the keyword-driven message and convert
		//If we've already customized, this just pulls it as it is without overwriting
		if (!this.saveCustomized) {
			this.customMessage = TextProcessorService.processLineBreaks($('.finalmessage').html()); 	
		}
		profile.customEditorActive = true; //adds custom editor property to the profile model
	};

	//Function that runs as soon as the custom message textarea is edited
	this.markAsCustomized = function() {
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

	}
);