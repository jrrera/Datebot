/**
 * @constructor
 * @ngInject
 */
function TextProcessorService() {}

angular.module('datebot').service(
    'TextProcessorService', TextProcessorService);

/**
 * Function that runs text through a series of Regex patterns designed to
 * convert HTML and comments into plain text.
 *
 * @param {string} text Text to run through regex.
 * @return {string} final Processed text.
 */
TextProcessorService.prototype.processLineBreaks = function(text) {
  var final = text.replace(/\s*<p[^>]+">\s*/gi,""); //Filters out all P tags
  final = final.replace(/<\/?span[^>]*?"?>/gi,""); //Filters out all span tags

  //Removes commented out HTML and arbitrary spacing in a nongreedy fashion
  final = final.replace(/\n*(?:\s{2,})?<!--(.|\n)*?-->\s*\n*/gi, "");

  //Puts a line break for any <br> tag
  final = final.replace(/\s*<br\s?\/?>\s*\n*<\/p>\n*\s*/gi, "\n\n");
  final = final.replace(/\s*<br\s?\/?>\s*/gi,"\n");

  //Adds two lines breaks for any closing p tags
  final = final.replace(/\s*<\/p>\s*/gi,"\n\n");
  return final;
};

/**
 * @param {string} keyword Keyword to match to in essay.
 * @param {Array.<string>} essays List of essays to process.
 * @return {string} final String of essays.
 */
TextProcessorService.prototype.findEssayTitle = function(keyword, essays) {
    // For any bit of context grabbed, will also grab the title of
    // that essay for the UI. Returns a string of HTML.
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
};

/**
* Removes a series of profile filler text snippets we don't want to analyze.
*/
TextProcessorService.prototype.processProfileText = function(profile) {
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


TextProcessorService.prototype.processContext = function(htmlObj){
  var contextArr = [];

  // for (var i = 0; i < 9; i++) {
  //   var contextObj = {};
  //
  //   name = htmlObj.find('#essay_'+i+'> a').text();
  //   essay = htmlObj.find('#essay_text_'+i).text();
  //
  //   finalEssay = essay.replace(/\n/gi," ");
  //
  //   contextObj.name = name;
  //   contextObj.essay = finalEssay;
  //
  //   contextArr.push(contextObj);
  // }
  //
  var essays = htmlObj.find('.essays2015-essay');

  essays.each(function(i) {
    var essay = {};
    essay.name = $(this).children().eq(0).text().trim();
    essay.essay = $(this).children().eq(1).text().replace(/\n/g," ").trim();
    contextArr.push(essay);
  });

  return contextArr;
};


/**
 * Extracts context snippets from essays for display in front end.
 */
TextProcessorService.prototype.extractContext = function(response, keywords, essays) {
  // Receives a list of keywords and essays, and pulls a snippet of text from
  // each essay surrounding the matched keyword.
  // Returns an array containing the snippets of context
  var contextArr = [], findKeyword, essayTitle, final;

  for (var i = 0; i < keywords.length; i++) {
    findKeyword = new RegExp('([^a-zA-Z]|\\n|\\r|\\r\\n)' + keywords[i] + '([^a-zA-Z]|\\n|\\r|\\r\\n)', 'g');

    if (response.search(findKeyword) != -1) {

      essayTitle = this.findEssayTitle(keywords[i], essays);

      var contextGrabber = response.match(new RegExp('\\S{0,10}(\\n|.){0,50}([^a-zA-Z]|\\n|\\r|\\r\\n)' + keywords[i] + '([^a-zA-Z]|\\n|\\r|\\r\\n)(\\n|.){0,50}\\S{0,10}', 'g')); //This RegEx finds the keyword, and on either side, adds a space (to capture only the whole word), and then captures all line breaks or characters 50 characters in either direction. Then, extends up to another 10 characters to finish at the nearest whole word

      final = essayTitle + contextGrabber[0];
      contextArr.push(final);
    }
  }
  return contextArr;
};

/**
 * A processor function that highlights the keyword in the context paragraph
 * for easier reference
 */
TextProcessorService.prototype.highlightMatches = function(keyword, context) {
  //The RegEx that looks for the keyword with a non-letter char on either side.
  var keywordReg = new RegExp('[^a-zA-Z]' + keyword + '[^a-zA-Z]', 'g');

  //Replace the keyword in the context with the keyword wrapped in span tags
  return context = context.replace(
      keywordReg,
      '<span class="bluekeywords">' + keywordReg.exec(context) + '</span>');
};


/**
 * Returns any array of matched keywords by looking through the HTML of the page
 * TODO(jon): This function needs some serious refactoring. It's modifying
 *   arrays from the caller in place. Tsk tsk.
 */
TextProcessorService.prototype.extractMatchedKeywords = function(response, keywords, desiredPriorityArr, finalKeywordPriorityArr) {
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


TextProcessorService.prototype.determineTopKeywords = function(matchObj) {
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
};
