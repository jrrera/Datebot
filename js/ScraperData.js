/**
 * @constructor
 * @ngInject
 */ 
function ScraperService($q) {
    /**
     * @type {angular.$q}
     */ 
  this.q_ = $q;

  /** @type {?string} */
  this.userId = null;
}

angular.module('dbotExtApp').service('ScraperData', ScraperService);  

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
      		console.log('The scraped HTML has arrived! :D');
    			deferred.resolve({html:msg.html});
        } 
      } else {
        deferred.reject('Error! Returned msg object did not contain an HTML property');
      }
    
    });  

	return deferred.promise;			
};

ScraperService.prototype.processProfileText = function(profile) {
  //This function removes the built-in OKC text headers, changes problematic double quotation marks to singles, and removes unnecessary spacing. 
  var replace1 = "my self-summary";
  var replace2 = "what i\u2019m doing with my life";
  var replace3 = "the first things people usually notice about me";
  var replace4 = "favorite books, movies, shows, music, and food";
  var replace5 = "the six things i could never do without";
  var replace6 = "i spend a lot of time thinking about";
  var replace7 = "on a typical friday night i am";
  var replace8 = "the most private thing i\u2019m willing to admit";
  var replace9 = "i\u2019m looking for";
  var replace10 = new RegExp('"', "g");
  var replace11 = "            ";

  var findreplace = [replace1,replace2,replace3,replace4,replace5,replace6,replace7,replace8,replace9,replace11];
  
  var textUpdate = profile;
  for (var i = 0; i < findreplace.length; i++) {
    textUpdate = textUpdate.replace(findreplace[i],"");
  }
    textUpdate = textUpdate.replace(replace10, "'");
    textUpdate = textUpdate.replace(/(\r\n|\n|\r)/gm," ");
    textUpdate = textUpdate.replace(/\s+/gm, " ");
  return textUpdate;
};

ScraperService.prototype.turnIntoJquery = function(html) {

  // jQuery was having errors trying to parse the full page. So we 
  // extract the core part of the document, where the ID starts using
  // page as a prefix. We close it off at the final div.
  var coreDocumentArr = /<div id="page"(.|\n)*<\/div>/gi.exec(html);
	var htmlObj = $(coreDocumentArr[0]);

	var okcText = htmlObj.find("#main_column").text().toLowerCase();
	var okcUserName = htmlObj.find('#basic_info_sn').text();
	var okcPicture = htmlObj.find('#thumb0 img').attr('src');

  // Get user ID and store on service to use for opening chat
  // panel automatically
  this.userId = htmlObj.find('#action_bar').data('userid'); 
	return [okcText, okcUserName, okcPicture, htmlObj];
};

ScraperService.prototype.processContext = function(htmlObj){
	var contextArr = [], name, essay, finalEssay;
  
  for (var i = 0; i < 9; i++) {
    var contextObj = {};

    name = htmlObj.find('#essay_'+i+'> a').text();
    essay = htmlObj.find('#essay_text_'+i).text();

    finalEssay = essay.replace(/\n/gi," ");

    contextObj.name = name;
    contextObj.essay = finalEssay;

    contextArr.push(contextObj);
  }

  return contextArr;
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
	//Begin utility functions for processing text
	function extractContext(response, keywords, essays) {
	  // Receives a list of keywords and essays, and pulls a snippet of text from 
	  // each essay surrounding the matched keyword. 
	  // Returns an array containing the snippets of context
	  var contextArr = [], findKeyword, essayTitle, final;
	  
	  for (var i = 0; i < keywords.length; i++) {
	    findKeyword = new RegExp('([^a-zA-Z]|\\n|\\r|\\r\\n)' + keywords[i] + '([^a-zA-Z]|\\n|\\r|\\r\\n)', 'g');

	    if (response.search(findKeyword) != -1) {

	      essayTitle = findEssayTitle(keywords[i], essays);
	      var contextGrabber = response.match(new RegExp('\\S{0,10}(\\n|.){0,50}([^a-zA-Z]|\\n|\\r|\\r\\n)' + keywords[i] + '([^a-zA-Z]|\\n|\\r|\\r\\n)(\\n|.){0,50}\\S{0,10}', 'g')); //This RegEx finds the keyword, and on either side, adds a space (to capture only the whole word), and then captures all line breaks or characters 50 characters in either direction. Then, extends up to another 10 characters to finish at the nearest whole word
	      
	      final = essayTitle + contextGrabber[0];
	      contextArr.push(final);
	    }
	  } 
	  return contextArr;
	}

	function findEssayTitle(keyword, essays){
	  //For any bit of context grabbed, will also grab the title of that essay for the UI. Returns a string of HTML
	  var final, keywordRe = new RegExp('[^a-zA-Z]' + keyword + '[^a-zA-Z]', 'i');

	  for (var i = 0; i < essays.length; i++) {
	    var essay = essays[i].essay;
	    //console.log("Now looking through this essay: ", essay);
	    if (essay.search(keywordRe) != -1) {
	      //console.log("Found a match for " + keyword + ": " + essays[i].name);
	      final = '<strong>' + essays[i].name + '</strong><br />';
	      return final;
	    } 
	  }
	  return "<strong>Unknown</strong><br />"; //If all else fails, return this
	}

	function extractMatchedKeywords(response, keywords) {
	  //Returns any array of matched keywords by looking through the HTML of the page
	  var matchedKeywords = [], findKeyword;
	  
	  for (var i = 0; i < keywords.length; i++) {
	    findKeyword = new RegExp('[^a-zA-Z]' + keywords[i] + '[^a-zA-Z]', 'g');
	    if (response.search(findKeyword) != -1) {
	      matchedKeywords.push(keywords[i]);
	      finalKeywordPriority.push(desiredPriority[i]);
	    }
	  } 
	  return matchedKeywords;
	}

	function highlightMatches(keyword, context) {
//A processor function that highlights the keyword in the context paragraph for easier reference
var keywordReg = new RegExp('[^a-zA-Z]' + keyword + '[^a-zA-Z]', 'g'); //The RegEx that looks for the keyword with a non-letter char on either side.
return context = context.replace(keywordReg, '<span class="bluekeywords">' + keywordReg.exec(context) + '</span>'); //Replace the keyword in the context with the keyword wrapped in span tags 
	}

	function determineTopKeywords(matchObj) {
		var checkedCount = 0, //Keeps track of checked keyword count
			prioritiesObj = {
				'priorityTwo' : [],
				'priorityThree' : []
			}; //Container for priority sorting if we didn't find enough top priority keywords (i.e. priority of 1)

		console.log('matchObj', matchObj.matched);
		//Put each match in the appropriate category
		$.each(matchObj.matched, function(i, match){
			if (checkedCount < 2) {
				if (parseInt(match.priority) === 1) {
					//console.log('Found a top keyword! Checked it off. Details:', match);
					match.checked = true; //If it's a top priority, just mark it as checked right away
					checkedCount++; //Increment the tracker
				} else if (parseInt(match.priority) === 2) {
					prioritiesObj.priorityTwo.push(match);
				} else {
					prioritiesObj.priorityThree.push(match);
				}
			} else {
				return false; //If we found out two checked keywords, break out of the loop
			}
		});

		if (checkedCount >= 2) return matchObj;  //If we met our quota, return


		//If we processed all keywords and still haven't found two top priority keywords, run through priority 2 and 3 list
		if (prioritiesObj.priorityTwo) {
			$.each(prioritiesObj.priorityTwo, function(i, match){
				if (checkedCount < 2) {
					match.checked = true;
					checkedCount++;	
				} else {
					return false; //Break when we hit the quota
				}
			});
			//If we met our quota, return
			if (checkedCount >= 2) return matchObj;
		}

		if (prioritiesObj.priorityThree) {
			$.each(prioritiesObj.priorityThree, function(i, match){
				if (checkedCount < 2) {
					match.checked = true;
					checkedCount++;	
				} else {
					return false; //Break when we hit the quota
				}
			});
			//If we met our quota, return
			if (checkedCount >= 2) return matchObj;
		}
	}

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

	var finalKeywords = extractMatchedKeywords(profile, desiredKeywords),
		finalContext = extractContext(profile, desiredKeywords, context);

	for (var i = 0; i < finalKeywords.length; i++) {
	  if (desiredKeywords.indexOf(finalKeywords[i]) != -1) {
	    var index = desiredKeywords.indexOf(finalKeywords[i]);
	    finalMessage.push(desiredMessage[index]);  
	  }
	}

	finalResult = {
		opener: keywords.opener.replace("\n", "<br />"),
		closer: keywords.closer.replace("\n", "<br />"),
		first_transition: keywords.first_transition,
		second_transition: keywords.second_transition
	};

	finalResult.matched = [];

	for (var i = 0; i < finalKeywords.length; i++) {
		var oneMatchObj = {};

		oneMatchObj.keyword = finalKeywords[i];
		oneMatchObj.context = highlightMatches(finalKeywords[i], finalContext[i]); //highlightMatches will turn the matched keyword blue, and receives the keyword and the context as the arguments, and will return the higlhighted context
		oneMatchObj.message = finalMessage[i];
		oneMatchObj.priority = finalKeywordPriority[i];

	    finalResult.matched.push(oneMatchObj);
	}
	
	console.log('finalResult', finalResult);

	// Before returning, we run the finalResult through a function that checks the highest priority 
	// keywords and flips on the checked attribute flag if it's a high priority keyword
	determineTopKeywords(finalResult); 
	return finalResult;
};




