/**
 * @constructor
 * @ngInject
 */
function ScraperService($q, TextProcessorService) {
  this.q_ = $q;

  this.textProcessorService = TextProcessorService;

  /** @type {?string} */
  this.userId = null;
}

angular.module('datebot').service('ScraperService', ScraperService);

ScraperService.prototype.getProfile = function() {
	console.log('Initalizing profile grab...');

  return this.q_(function(resolve, reject) {
    // Pass angular.noop as callback, since we add a listener coming back
    // upstream. Can merge this two calls together in the future.
    window.chrome.runtime.sendMessage({method:"triggerScript"}, angular.noop);

    //Then, we listen for a response. If the msg object has an HTML property, we're in businesss
    window.chrome.runtime.onMessage.addListener(function (msg, sender, sendResponse) {
      if (msg.html) {
  			resolve({html:msg.html});
      } else {
        reject('Error! Returned msg object did not contain HTML');
      }
    });

  });
};


ScraperService.prototype.extraBasicData = function(htmlStr) {

  // Extract the core part of the document.
  var coreDocumentArr = /<div id="main_content"(.|\n)*<\/div>/gi.exec(htmlStr);
	var htmlObj = $(coreDocumentArr[0]);

	var okcText = htmlObj.find(".profile2015-content-main").text().toLowerCase().trim();
	var okcUserName = htmlObj.find('.userinfo2015-basics-username').text().trim();
	var okcPicture = htmlObj.find('img.active').attr('src');

  return {
    profile: okcText,
    username: okcUserName,
    imgUrl: okcPicture,
    $html: htmlObj
  };

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
  			"opener":"Hey, how's it going?",
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
		opener: keywords.opener.replace(/(?:\r\n|\r|\n)/g, "<br />"),
		closer: keywords.closer.replace(/(?:\r\n|\r|\n)/g, "<br />"),
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
