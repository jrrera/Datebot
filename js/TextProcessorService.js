/**
 * @constructor
 * @ngInject
 */ 
function TextProcessorService() {}

angular.module('datebot').service(
    'TextProcessorService', TextProcessorService);


/**
 * Main function exposed to controller to convert scraped HTML to Datebot
 * analysis.
 *
 * @param {Object} htmlDataObj Data extracted from profile page, preprocessed.
 * @param {Object} keywordData Local keyword data to match again the profile.
 * @return {Object} matchObject Object with data to render on the DOM.
 */ 
TextProcessorService.prototype.convertHtmlDataToProfile = 
    function(htmlDataObj, keywordData) {
  var profileText = this.replaceGenericProfileText(htmlDataObj.profileText), 
      contextData = this.processContext(htmlDataObj.html),
      matchData = this.findSimilarities(
                      htmlDataObj.profileText, keywordData, contextData);
  
 return {
    okcUsername: htmlDataObj.user,
    metaData: {
      text: profileText,
      pictureUrl: htmlDataObj.pictureUrl,
      context: contextData
    },
    matchData: matchData
  };
};


/**
 * Function that runs text through a series of Regex patterns designed to
 * convert HTML and comments into plain text.
 *
 * Note: These regex patterns are ugly, but abstracted solutions such as 
 *     jQuery.text() yielded terrible results with Angular's HTML syntax. 
 *
 * @param {string} text Text to run through regex.
 * @return {string} final Processed text.
 */ 
TextProcessorService.prototype.processLineBreaks = function(text) {
  return text.replace(/\s*<p[^>]+">\s*/gi,'')  // Filters out all P tags.
             .replace(/<\/?span[^>]*?"?>/gi,'')  // Filters out all span tags.
             // Removes commented HTML and arbitrary spacing, nongreedy.
             .replace(/\n*(?:\s{2,})?<!--(.|\n)*?-->\s*\n*/gi, '')
             // Puts a line break for any <br> tag.
             .replace(/\s*<br\s?\/?>\s*\n*<\/p>\n*\s*/gi, '\n\n')
             .replace(/\s*<br\s?\/?>\s*/gi, '\n')
             // Adds two lines breaks for any closing p tags.
             .replace(/\s*<\/p>\s*/gi, '\n\n'); 
};


/**
 * Searches through essays and matches the keyword under analysis to a 
 * particular essay. If its matched in an essay, return the title.
 *
 * TODO(jon): We should separate HTML generation from finding the correct
 *    essay.
 *
 * @param {string} keyword Keyword to match to in essay.
 * @param {Array.<string>} essays List of essays to process.
 * @return {string} essayTitleHtml  
 */ 
TextProcessorService.prototype.findEssayTitle = function(keyword, essays) {
  var keywordRegEx = new RegExp('[^a-zA-Z]' + keyword + '[^a-zA-Z]', 'i'),
      essayTitleHtml = "<strong>Unknown</strong><br />";

  essays.forEach(function(essay) {
    var essayText = essay.essay;
    if (essayText.search(keywordRegEx) !== -1) {
      essayTitleHtml = '<strong>' + essay.title + '</strong><br />';
    } 
  });
  
  return essayTitleHtml; 
};


/**
 * Removes a series of profile filler text snippets we don't want to analyze.
 * In particular, removes the built-in OKC text headers, changes problematic 
 * double quotation marks to singles, and removes unnecessary spacing. 
 *
 * @param {profile} string Raw string of profile HTML to process.
 * @return {string} textUpdate Profile HTML post-processing.
 */
TextProcessorService.prototype.replaceGenericProfileText = function(profile) {
  var genericPhrases = [ 
      "my self-summary",
      "what i\u2019m doing with my life",
      "the first things people usually notice about me",
      "favorite books, movies, shows, music, and food",
      "the six things i could never do without",
      "i spend a lot of time thinking about",
      "on a typical friday night i am",
      "the most private thing i\u2019m willing to admit",
      "i\u2019m looking for" 
  ];
  
  genericPhrases.forEach(function(genericPhrase) {
    profile = profile.replace(genericPhrase, '');
  });
  
  return profile;
};


/**
 * Takes in a profile, your keywords, and the context for the keywords and 
 * finds similarities between you and the person whose profile you're viewing.
 * 
 * @param {string} profile The extracted profile text as a raw string.
 * @param {!Object} keywords The keywords Datebot uses to find mutual interests.
 * @param {JQuery} context A jQuery object of the HTML of the page.
 * @return {Array.<Object>} finalResult An array of objects representing a
 *     matched commonality (e.g. fishing).
 */
TextProcessorService.prototype.findSimilarities = function(profile, keywords, context) {

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

  var finalKeywords = this.extractMatchedKeywords(
      profile, desiredKeywords, desiredPriority, finalKeywordPriority);

  var finalContext = this.extractContext(
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
    oneMatchObj.context = this.highlightMatches(
        finalKeywords[i], finalContext[i]); 
    oneMatchObj.message = finalMessage[i];
    oneMatchObj.priority = finalKeywordPriority[i];

    finalResult.matched.push(oneMatchObj);
  }
  
  console.log('finalResult', finalResult);

  // Before returning, we run the finalResult through a function that checks the highest priority 
  // keywords and flips on the checked attribute flag if it's a high priority keyword
  this.determineTopKeywords(finalResult); 
  return finalResult;
};


/**
 * Generates objects that contain the name of the essay and the written text
 * within that essay based on OKCupid's dom structure.
 * 
 * @param {JQuery} htmlObj The jQuery-wrapped HTML from the profile page.
 * @return {Array.<Object>} essayContexts List of essay info object.
 */
TextProcessorService.prototype.processContext = function(htmlObj){
  var essayContexts = [], 
      essayContext,
      essayTitle, 
      essayContent;
  
  for (var i = 0; i < 9; i++) {
    essayTitle = htmlObj.find('#essay_'+i+'> a').text();
    essayContent = htmlObj.find('#essay_text_'+i).text();
    essayContent = essayContent.replace(/\n/gi," ");

    essayContext = {
      'title': essayTitle,
      'essay': essayContent
    };

    essayContexts.push(essayContext);
  }

  return essayContexts;
};


/**
 * Extracts context snippets from essays for display in front end. 
 * In particular, receives a list of keywords and essays, and pulls a snippet 
 * of text from each essay surrounding the matched keyword. 
 *
 * @param {string} profile The extracted profile text as a raw string.
 * @param {!Object} keywords The keywords you and the match have in common.
 * @param {Array.<Object>} essays Essay titles and descriptions.
 * @return {Array} contextArr List containing the snippets of context.
 */ 
TextProcessorService.prototype.extractContext = function(profile, keywords, essays) {
  var contextArr = [], 
      regExString,
      keywordRegEx, 
      essayTitle, 
      contextGrabber,
      essayTitleWithContext;
  
  keywords.forEach(function(keyword) {
    // Pad the keyword with a non-letter. This way, the keyword
    // 'food' won't match 'foodie', for example.
    regExString = '([^a-zA-Z]|\\n)' + keyword + '([^a-zA-Z]|\\n)';
    keywordRegEx = new RegExp(regExString, 'g');

    if (profile.search(keywordRegEx) !== -1) {

      essayTitle = this.findEssayTitle(keyword, essays);

      //This RegEx finds the keyword, and on either side, adds a space (to capture only the whole word), and then captures all line breaks or characters 50 characters in either direction. Then, extends up to another 10 characters to finish at the nearest whole word
      essayContext = profile.match(new RegExp('\\S{0,10}(\\n|.){0,50}([^a-zA-Z]|\\n|\\r|\\r\\n)' + keyword + '([^a-zA-Z]|\\n|\\r|\\r\\n)(\\n|.){0,50}\\S{0,10}', 'g')); 

      essayTitleWithContext = essayTitle + essayContext[0];

      contextArr.push(essayTitleWithContext);
    }
  }.bind(this));
  
  return contextArr;
};


/**
 * A processor function that highlights the keyword in the context paragraph 
 * blue for easier reference.
 *
 * @param {string} keyword The topic of interest between you and the match.
 * @param {string} context The profile snippet containing the keywords.
 * @param {string} processedContext Same snippet with HTML added for coloring.
 */
TextProcessorService.prototype.highlightMatches = function(keyword, context) {
  //The RegEx that looks for the keyword with a non-letter char on either side.
  var keywordReg = new RegExp('[^a-zA-Z]' + keyword + '[^a-zA-Z]', 'g'); 

  //Replace the keyword in the context with the keyword wrapped in span tags 
  return context.replace(
      keywordReg, 
      '<span class="bluekeywords">' + keywordReg.exec(context) + '</span>'); 
};


/**
 * Returns any array of matched keywords by looking through HTML of the page.
 * TODO(jon): This function needs some serious refactoring. It's modifying
 *   arrays from the caller in place. Tsk tsk.
 */
TextProcessorService.prototype.extractMatchedKeywords = 
    function(response, keywords, desiredPriorityArr, finalKeywordPriorityArr) {
  var matchedKeywords = [], findKeyword;
  
  for (var i = 0; i < keywords.length; i++) {
    findKeyword = new RegExp('[^a-zA-Z]' + keywords[i] + '[^a-zA-Z]', 'g');
    if (response.search(findKeyword) != -1) {
      matchedKeywords.push(keywords[i]);
      finalKeywordPriorityArr.push(desiredPriorityArr[i]);
    }
  } 
  return matchedKeywords;
}; 

/**
 * Takes all matched interests and sorts them by your chosen priority to help
 * better calculate how good of a match the current profile is.
 */
TextProcessorService.prototype.determineTopKeywords = function(matchObj) {
    var checkedCount = 0; // Keeps track of checked keyword count.

    // Container for priority sorting if we didn't find enough top priority 
    // keywords (i.e. priority of 1).
    var prioritiesObj = {
        'priorityTwo' : [],
        'priorityThree' : []
      }; 

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


    // If we processed all keywords and still haven't found two top priority 
    // keywords, run through priority 2 and 3 list.
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
};



