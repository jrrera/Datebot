'use strict';

angular.module('datebot').controller('ProfileController', 
	function ProfileController(ScraperService, TextProcessorService, 
	                           MatchService, LocalDataService) {


		this.customMessage = '';

		//Begin cascade of async calls for username, keywords, and profile
		this.initialize = function() {
			this.loading = true; 

			ScraperService.getKeywords().then(angular.bind(this, function(data) {
				this.keywords = data;

				if (ScraperService.foundKeywordsLocally) {
					this.foundKeywords = true;
				}

				ScraperService.getProfile().then(angular.bind(this, function(data) {
					var htmlDataObj = ScraperService.turnIntoJquery(data.html);

					// Object exposed to the front end.  
					this.profile = TextProcessorService.convertHtmlDataToProfile(
							htmlDataObj, this.keywords);

					this.profile.matchScore = MatchService.calculateMatchScore(
					                              this.profile);

					this.profile.recommendation = MatchService.getRecommendation(
					                                  this.profile.matchScore);

					this.loading = false;

					// Restore any locally stored data if you viewed this profile last time.
					if (LocalDataService.cachedProfileDataFound(this.profile.okcUsername)) {
						this.profile.matchData.customized = true; //Adds customized flag to the model
						this.customMessage = LocalDataService.getSavedMessage();
						this.saveCustomized = true;
					}

				}), 
				angular.bind(this, function errorHandler(e) {
					console.log(e);
					this.loading = false;
				})
			); // End inner async call.
		})); // End outer async call.
	};

	this.initialize();  // Initalizes the app.

	// Expose generic message text for those lacking data to work with.
	this.genericQuestion = TextProcessorService.getGenericQuestion();

	// When the profiles model is updated by adjusting keyword choices, 
	// customized becomes false again and we keep the message model in sync.
	this.keywordClick = function() {
		//Reset the customized message flags
		this.profile.matchData.customized = false;
		this.saveCustomized = false;

		LocalDataService.clearCustomMessageData();

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
		var message, interactionData, portObj;
		
		// If customized, this.customMessage from textarea is what's sent. 
		// Else, the standard .finalmessage div's contents are used
		message = this.saveCustomized 
									? this.customMessage 
									: TextProcessorService.processLineBreaks(
												$('.finalmessage').html());

		portObj = {
		  message: message,
		  userId: ScraperService.userId
		};

		// Send the message to the background script & record the interaction
		// TODO(jon): Update the object key to be more descriptive of contents.
		chrome.runtime.sendMessage({portover3: portObj}, function(response) {
			if (response.status === 'message_sent' && !this.noTracking) {
				console.log('Recording interaction!', this.profile);
				LocalDataService.recordInteraction(this.profile);
			}
		}.bind(this));
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
		this.profile.matchData.customized = true; //Adds customized flag to the model
	};

	this.saveCustomEdit = function(profile) {			
		
		profile.customEditorActive = false; 
		
		if (profile.matchData.customized) {
			// This determines which div gets grabbed for sending the 
			// final message to the recipient.
			this.saveCustomized = true; 

			// Next, we save locally, so if you leave the app temporarily, and 
			// view the same profile shortly after, your work will be saved.
			LocalDataService.saveCustomMessageData(
					profile.okcUsername, this.customMessage);
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