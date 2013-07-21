//START DEFINING FUNCTIONS
//If can find a keyword in the blob of context, push the keyword to one array, and RegEx the context into another array. Pass both of those arrays back.
function extractMatchedKeywords(response, keywords) {
  var matchedKeywords = [];
  var findKeyword;
  for (var i = 0; i < keywords.length; i++) {
    findKeyword = new RegExp('[^a-zA-Z]' + keywords[i] + '[^a-zA-Z]', 'g');
    if (response.search(findKeyword) != -1) {
      matchedKeywords.push(keywords[i]);
    }
  } 
  console.log(matchedKeywords);
  return matchedKeywords;
}

function extractContext(response, keywords) {
  //console.log("This is what we're extracting context from: ", response);
  var contextArr = [];
  var findKeyword;
  for (var i = 0; i < keywords.length; i++) {
    findKeyword = new RegExp('[^a-zA-Z]' + keywords[i] + '[^a-zA-Z]', 'g');
    if (response.search(findKeyword) != -1) {
      var contextGrabber = response.match(new RegExp('[^\s]{0,10}(\n|.){0,50}[^a-zA-Z]' + keywords[i] + '[^a-zA-Z](\n|.){0,50}[^\s]{0,10}', 'g'));
      //This RegEx finds the keyword, and on either side, adds a space (to capture only the whole word), and then captures all line breaks or characters 50 characters in either direction. Then, extends up to another 10 characters to finish at the nearest whole word
      console.log("contextGrabber for the keyword " + keywords[i] + ": ", contextGrabber);
      contextGrabber[0] = contextGrabber[0].replace(/(\r\n|\n|\r)/gm," / "); //Replaces line breaks with a space to prevent code from being broken
      console.log("contextGrabber[0] after find and replace for the keyword " + keywords[i] + ": ", contextGrabber[0]);
      contextArr.push(contextGrabber[0]);
    }
  console.log("Context Array from this page: ", contextArr);
  } 
  return contextArr;
}

function removeProfileFluff(text){
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

  //console.log("this is the text passed into the removeProfileFluff function: ", text);
  //console.log("findreplace array: ", findreplace);
  
  var textUpdate = text;
  for (var i = 0; i < findreplace.length; i++) {
    textUpdate = textUpdate.replace(findreplace[i],"");
  }
    textUpdate = textUpdate.replace(replace10, "'");

  return textUpdate;
}
//END DEFINING FUNCTIONS


//START LISTENERS AND DATA PROCESSING
//Set a listener that will capture the getProfile request of the popup and content from the content_script
var okcText = "";
var okcUserName = "";
chrome.runtime.onMessage.addListener(function (msg, sender, sendResponse) {
  if(msg.content) {
    //console.log("content has been received, bro: ", msg.content);

    okcText = removeProfileFluff(msg.content[0]);
    //console.log("The NEW okcText: ", okcText);

    okcUserName = msg.content[1];
    okcPicture = msg.content[2];
  }

  if(msg.method == "getProfile") {
    
    var profile = JSON.parse(localStorage["keywords"]);
    var pairs = profile.pairs;

    var desiredKeywords = []; 
    var desiredMessage = [];
    var finalKeywords, finalContext, okcResponse;
    var finalMessage = [];
    var finalResult = "";
    var opener = profile.opener;
    var closer = profile.closer;

    for (var i = 0; i < pairs.length; i++) {
      desiredKeywords.push(pairs[i].keyword);
      desiredMessage.push(pairs[i].message);
    }

    //console.log("opener: ", opener);
    //console.log("closer: ", closer);

    //Now, we create the final JSON object to pass to the popup for processing
    if (okcText) {
      okcResponse = okcText;  

      finalKeywords = extractMatchedKeywords(okcResponse,desiredKeywords);
      finalContext = extractContext(okcResponse,desiredKeywords);

      for (var i = 0; i < finalKeywords.length; i++) {
        if (desiredKeywords.indexOf(finalKeywords[i]) != -1) {
          var index = desiredKeywords.indexOf(finalKeywords[i]);
          finalMessage.push(desiredMessage[index]);  
        }
        console.log("index: ", index);
        console.log(finalKeywords);
        console.log(finalMessage);
      }

      finalResult += '{"user":"' + okcUserName + '",';
      finalResult += '"age": 23,"location": "San Francisco, CA",';
      finalResult += '"pic":"' + okcPicture + '",';
      finalResult += '"opener":"' + opener + ' ",'; //extra space added to this phrase after the variable for proper final sentence structure
      finalResult += '"closer":"' + closer + ' ",'; //extra space added to this phrase after the variable for proper final sentence structure
      finalResult += '"matched": [';

      for (var i = 0; i < finalKeywords.length; i++) {
        finalResult += '{"keyword":"' + finalKeywords[i] + '",';
          finalResult += '"context":"' + finalContext[i] + '",';
          finalResult += '"message":"' + finalMessage[i] + '"}';
          if (i == (finalKeywords.length - 1)) {
            console.log("The final keyword!");
          } else {
            finalResult += ",";
          } //Adds a comma for the JSON when the keyword is NOT the last keyword in the list
      }

      finalResult += ']}';
    }
    console.log(finalResult);
    sendResponse(finalResult);
  }


  if(msg.method == "triggerScript") {
    chrome.tabs.query({ currentWindow: true, active: true }, function (tabs) { 
      var tabId = tabs[0].id;
      console.log("Was able to get the current tab: ", tabs[0]);

      chrome.tabs.sendMessage(tabId, {action:"scrape"},function(response){
        console.log("Sent a message off to the content script and receive a response! It was: ", response);
        chrome.runtime.sendMessage({finalresult:"ready"},function(response){
            console.log("The deed has been done!");

        });
      });
    });         



  }
});