/**
 * @constructor
 * @ngInject
 */
function ScraperService($q, TextProcessorService) {
    /**
     * @type {angular.$q}
     */
  this.q_ = $q;

  this.textProcessorService = TextProcessorService;

  /** @type {?string} */
  this.userId = null;
}

angular.module('datebot').service('ScraperService', ScraperService);

ScraperService.prototype.getProfile = function() {
	console.log('Initalizing profile grab...');

	var deferred = this.q_.defer(); //$q service uses async promises so you're not nesting callbacks on callbacks on callbacks

    //First, we send a runtime message to the background script. Then, we add a listener for the result back the content and background scripts.
    window.chrome.runtime.sendMessage({method:"triggerScript"},function(response){});

    //Then, we listen for a response. If the msg object has an HTML property, we're in businesss
    window.chrome.runtime.onMessage.addListener(function (msg, sender, sendResponse) {
      if (msg.html) {
      	if (!msg.html.length) {
    			deferred.reject('Error! There was nothing returned in msg.html!');
      	} else {
      		console.log('The scraped HTML has arrived! :D', msg.html);
    			deferred.resolve({html:msg.html});
        }
      } else {
        deferred.reject('Error! Returned msg object did not contain an HTML property');
      }

    });

	return deferred.promise;
};


ScraperService.prototype.turnIntoJquery = function(html) {

  // jQuery was having errors trying to parse the full page. So we
  // extract the core part of the document, where the ID starts using
  // page as a prefix. We close it off at the final div.
  var coreDocumentArr = /<div id="main_content"(.|\n)*<\/div>/gi.exec(html);
	var htmlObj = $(coreDocumentArr[0]);

	var okcText = htmlObj.find(".profile2015-content-main").text().toLowerCase().trim();
	var okcUserName = htmlObj.find('.userinfo2015-basics-username').text().trim();
	var okcPicture = htmlObj.find('img.active').attr('src');

  // Get user ID and store on service to use for opening chat
  // panel automatically
  // this.userId = htmlObj.find('#action_bar').data('userid');
  console.log([okcText, okcUserName, okcPicture, htmlObj]);
	return [okcText, okcUserName, okcPicture, htmlObj];

};


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
