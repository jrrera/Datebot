/**
 * @constructor
 * @ngInject
 */ 
function ScraperService($q, $window, TextProcessorService) {
  /**
   * @type {angular.$q}
   */ 
  this.q_ = $q;

  /**
   * @type {Window}
   */ 
  this.window_ = $window;

  this.textProcessorService = TextProcessorService;

  /** 
   * @type {?string=} 
   */
  this.userId = null;
}

// Register the service.
angular.module('datebot').service('ScraperService', ScraperService);  

/**
 * Kicks off async Chrome background script requests to scape data off the
 * current OKCupid profile page.
 * 
 * @return {Promise.<Object, string>} Returns HTML in an obj if successful, 
 *     or a string if rejected.
 */
ScraperService.prototype.getProfile = function() {
	console.log('Initalizing profile grab...');

	var deferred = this.q_.defer(); //$q service uses async promises so you're not nesting callbacks on callbacks on callbacks

    // First, we send a runtime message to the background script. Then, we add
    // a listener for the result back the content and background scripts. 
    // We don't do anything with the response, but pass in a function anyway
    // for the API's requirements.
    // TODO(jon): Update this code flow to work within the callback.
    this.window_.chrome.runtime.sendMessage({
      method:"triggerScript"
    },function(){});
    
    // Then, we listen for a response. If the msg object has an HTML property, 
    // we're in businesss
    this.window_.chrome.runtime.onMessage.addListener(function (msg, sender, sendResponse) {		        
      if (msg.html) {
      	if (!msg.html.length) {
    			deferred.reject('Error! There was nothing returned in msg.html!');
      	} else {
      		console.log('The scraped HTML has arrived! :D');
    			deferred.resolve({html:msg.html});
        } 
      } else {
        deferred.reject('Error! Returned msg object did not contain an HTML property');
      }
    
    });  

	return deferred.promise;			
};

/**
 * Takes a raw HTML string and parses it to determine:
 *   a. Profile text
 *   b. Username
 *   c. The img src of the profile picture
 * TODO(jon): Refactor this to return an object.
 * 
 * @return {Array.<string>} profileArray Array of profile info,
 */
ScraperService.prototype.turnIntoJquery = function(html) {

  // jQuery was having errors trying to parse the full page. So we 
  // extract the core part of the document, where the ID starts using
  // "page" as a prefix. We close it off at the final div.
  var coreDocumentArr = /<div id="page"(.|\n)*<\/div>/gi.exec(html);
	var htmlObj = $(coreDocumentArr[0]);

	var okcText = htmlObj.find("#main_column").text().toLowerCase();
	var okcUserName = htmlObj.find('#basic_info_sn').text();
	var okcPicture = htmlObj.find('#thumb0 img').attr('src');

  // Get user ID and store on service to use for opening chat panel later.
  // TODO(jon): Consider registering this with a MessageSender service.
  this.userId = htmlObj.find('#action_bar').data('userid'); 
	return [okcText, okcUserName, okcPicture, htmlObj];
};

/**
 * Attempts to grab your saved keywords from localStorage. Holds on to defaults 
 * to give you if no saved data is found. 
 * 
 * @return {!Object} dbotKeywords Keywords that datebot uses to suggest msgs.
 */
ScraperService.prototype.getKeywords = function() {
	var deferred = this.q_.defer();

	chrome.storage.local.get('dbotKeywords', angular.bind(this, function(result) {
		if (result.dbotKeywords) {

      this.foundKeywordsLocally = true;
      deferred.resolve(angular.fromJson(result.dbotKeywords));

		} else {
  		console.log('no keywords found. giving defaults');
  		var defaultKeywords = {
  			"opener":"Hey, how's it going?\n\n", 
  			"closer":"Cheers,\n{Name}",
  			"first_transition" : "Also,",
  			"second_transition" : "Oh, and", 
  			"pairs": [
  				{
  					"keyword": "cooking",
  					"message": "I'm really into cooking too. Do you have a specialty dish? Mine's {{INSERT DISH NAME HERE}}.",
  					"priority": 2
  				},
  				{
  					"keyword": "travel",
  					"message": "How was traveling in {{COUNTRY/STATE/PLACE}}? I've been to {{COUNTRY/STATE/PLACE}} and had an amazing time.",
  					"priority": 2
  				},
  				{
  					"keyword": "foodie",
  					"message": "I'm a total foodie too. Have you ever been to {{PLACE}} in {{NEIGHBORHOOD}}? It's unbelievable.",
  					"priority": 2
  				},
  				{
  					"keyword": "thai",
  					"message": "Thai food is my absolutely favorite right now. Have you been to {{PLACE}} in {{NEIGHBORHOOD}}? It's fantastic.",
  					"priority": 2
  				},
  				{
  					"keyword": "barhopping",
  					"message": "Since moving here, I've been loving the bar scene. What's your favorite bar? I'm pretty fond of {{BAR}}.",
  					"priority": 2
  				},
  				{
  					"keyword": "game of thrones",
  					"message": "I definitely share your love for Game of Thrones. Who's your favorite character? I'd have to give it to Jon Snow on that one.",
  					"priority": 2
  				}
  			]
  		};

  		deferred.resolve(angular.fromJson(defaultKeywords))
		}
	}));
		
	return deferred.promise;
};

/**
 * Takes in a profile, your keywords, and the context for the keywords and 
 * finds similarities between you and the person whose profile you're viewing.
 * @param {string} profile The extracted profile text as a raw string.
 * @param {!Object} keywords The keywords Datebot uses to find mutual interests.
 * @param {JQuery} context A jQuery object of the HTML of the page.
 * @return {Array.<Object>} finalResult An array of objects representing a
 *     matched commonality (e.g. fishing).
 */
ScraperService.prototype.findSimilarities = function(profile, keywords, context) {

	//Begin processing the data by sorting in the appropriate array
	var desiredKeywords = [], 
        desiredMessage = [], 
        desiredPriority =[], 
        finalKeywordPriority = [], 
        finalMessage = [];

	//Put the desiredKeywords in one array, and the related message in another array.
	for (var i = 0; i < keywords.pairs.length; i++) {
	  desiredKeywords.push(keywords.pairs[i].keyword);
	  desiredMessage.push(keywords.pairs[i].message);
	  desiredPriority.push(keywords.pairs[i].priority);
	}

	var finalKeywords = this.textProcessorService.extractMatchedKeywords(
      profile, desiredKeywords, desiredPriority, finalKeywordPriority);

	var finalContext = this.textProcessorService.extractContext(
        profile, desiredKeywords, context);

	for (var i = 0; i < finalKeywords.length; i++) {
	  if (desiredKeywords.indexOf(finalKeywords[i]) != -1) {
	    var index = desiredKeywords.indexOf(finalKeywords[i]);
	    finalMessage.push(desiredMessage[index]);  
	  }
	}

	var finalResult = {
		opener: keywords.opener.replace("\n", "<br />"),
		closer: keywords.closer.replace("\n", "<br />"),
		first_transition: keywords.first_transition,
		second_transition: keywords.second_transition
	};

	finalResult.matched = [];

	for (var i = 0; i < finalKeywords.length; i++) {
		var oneMatchObj = {};

		oneMatchObj.keyword = finalKeywords[i];

    // highlightMatches will turn the matched keyword blue
		oneMatchObj.context = this.textProcessorService.highlightMatches(
        finalKeywords[i], finalContext[i]); 
		oneMatchObj.message = finalMessage[i];
		oneMatchObj.priority = finalKeywordPriority[i];

	  finalResult.matched.push(oneMatchObj);
	}
	
	console.log('finalResult', finalResult);

	// Before returning, we run the finalResult through a function that checks the highest priority 
	// keywords and flips on the checked attribute flag if it's a high priority keyword
	this.textProcessorService.determineTopKeywords(finalResult); 
	return finalResult;
};




