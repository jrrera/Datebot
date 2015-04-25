'use strict';

angular.module('datebot').controller('ProfileController', 
		function ProfileController(ScraperService, TextProcessorService, 
	                             MatchService, LocalDataService) {
	this.customMessage = '';

	/**
	 * Bootstrapping point for the app. This is where we make the necessary
	 * async calls for keywords and profile data.
	 */
	this.initialize = function() {
		this.loading = true; 

		ScraperService.getKeywords().then(angular.bind(this, function(data) {
			this.keywords = data;

			if (ScraperService.foundKeywordsLocally) {
				this.foundKeywords = true;
			}

			ScraperService.getProfile().then(angular.bind(this, function(data) {
				var htmlDataObj = ScraperService.parseRawHtml(data.html);

				// Object exposed to the front end.  
				this.profile = TextProcessorService.convertHtmlDataToProfile(
						htmlDataObj, this.keywords);

				this.profile.matchScore = MatchService.calculateMatchScore(
				                              this.profile);

				this.profile.recommendation = MatchService.getRecommendation(
				                                  this.profile.matchScore);

				this.loading = false;

				// Restore any cached data if you viewed this profile last time.
				if (LocalDataService.cachedUserDataFound(this.profile.okcUsername)) {
					this.profile.matchData.customized = true; 
					this.customMessage = LocalDataService.getSavedMessage();
					this.saveCustomized = true;
				}
			}), 
			angular.bind(this, function errorHandler(e) {
				console.log(e);
				this.loading = false;
			}));  // End inner async call.
		}));  // End outer async call.
	};

	// Script starts here.
	this.initialize();

	// Expose generic message text for those lacking data to work with.
	this.genericQuestion = TextProcessorService.getGenericQuestion();

	/**
	 * Event handler for adjusting your selected keywords. When this happens
	 * we remove any customizations to keep the model in sync.
	 */
	this.keywordClick = function() {
		
		// Remove customized data.
		this.profile.matchData.customized = false;
		this.saveCustomized = false;
		LocalDataService.clearCustomMessageData();

		// TODO(jon): Either abstract into a directive, or find a non-DOM approach.
		this.customMessage = TextProcessorService.processLineBreaks(
				TextProcessorService.getMessageHtml());
	};

	/**
	 * Moves a particular keyword in the message order, either up or down.
	 * 
	 * @param {number} keywordIndex Position in the keywords array.
	 * @param {string} direction Which way to adjust the keyword
	 */
	this.adjustKeywordPosition = function(keywordIndex, direction) {

		console.log(arguments);
		console.log(this.profile.matchData.matched);
		
		var keywordArray = this.profile.matchData.matched,
				clickedKeyword = keywordArray[keywordIndex],
				newIndex = (direction === 'up' ? keywordIndex-1 : keywordIndex+1),
				keywordToSwitchWith;

		keywordToSwitchWith = keywordArray[newIndex];
		keywordArray[keywordIndex] = keywordToSwitchWith;
		keywordArray[newIndex] = clickedKeyword;	

		// Since adjusting order is a click event on keywords, we trigger this.
		this.keywordClick(); 
	};

	/**
	 * Sends your message through the Chrome framework to inject onto the page.
	 * 
	 * @param {Object} profile The profile data, including your message.
	 */
	this.sendToTab = function(profile){
		var message, interactionData, msgData;
		
		// If customized, this.customMessage from textarea is what's sent. 
		// Else, the standard .finalmessage div's contents are used
		message = this.saveCustomized 
									? this.customMessage 
									: TextProcessorService.processLineBreaks(
												TextProcessorService.getMessageHtml());

		msgData = {
		  message: message,
		  userId: ScraperService.userId
		};

		// Send the message to the background script & record the interaction.
		chrome.runtime.sendMessage({datebotMessage: msgData}, function(response) {
			if (response.status === 'message_sent' && !this.noTracking) {
				console.log('Recording interaction!', this.profile);
				LocalDataService.recordInteraction(this.profile);
			}
		}.bind(this));
	};
	
  /**
   * A debugging function to preview messaging rendering post-processing.  
   */ 
  this.testMessage = function() {
    return this.saveCustomized ? 
    		this.customMessage.replace(/\n/g, '<br />') : 
    		TextProcessorService.processLineBreaks(
						TextProcessorService.getMessageHtml()).replace(/\n/g, '<br />');
  };

  /**
   * Enables the custom message editor in the view.
   * 
   * @param {Object} profile
   */
	this.showCustomEditor = function(profile) {
		// Start fresh if no previous custom message.
		if (!this.saveCustomized) {
			this.customMessage = TextProcessorService.processLineBreaks(
					TextProcessorService.getMessageHtml()); 	
		}
		profile.customEditorActive = true; 
	};

	//Function that runs as soon as the custom message textarea is edited.
	this.markAsCustomized = function() {
		this.profile.matchData.customized = true; 
	};

	/**
	 * Saves any custom edits you've made to th emessage.
	 *
	 * @param {Object} profile
	 */
	this.saveCustomEdit = function(profile) {			
		
		profile.customEditorActive = false; 
		
		if (profile.matchData.customized) {
			// This determines which div gets grabbed for sending the final message.
			this.saveCustomized = true; 

			// Save your custom work locally.
			LocalDataService.saveCustomMessageData(
					profile.okcUsername, this.customMessage);
		} 
	};

	/**
	 * Exposes the options page from within the view.
	 */
	this.goToOptions = function() {
		LocalDataService.openChromeExtensionOptions();
	};

	}
);