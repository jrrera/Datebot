var testEnvironment = false;

//START DEFINING FUNCTIONS

//Playground for context menu

//Opens the options page so that the .js can run on that page. Once that's create, callback function sends a message containing the keyword
//that the options page can grab
function sendKeyword(info,tab) {
  var extId = chrome.i18n.getMessage("@@extension_id"); //Gets the extension ID for opening the options page. Not required for creating the tab, but required for checking to see if the URL is open
  console.log("Word " + info.selectionText + " was clicked.");
  chrome.tabs.create({ 
      url: "chrome-extension://" + extId + "/options.html",
      active: false
  }, function(){
      chrome.tabs.query({}, function (tab){ //This is necessary to make sure the page fully loads in the browser before the message is sent
        for(var i =0; i < tab.length; i++) {
          if (tab[i].url === "chrome-extension://" + extId + "/options.html") {
            console.log("Looks like the page has loaded. Sending the message!");
            chrome.runtime.sendMessage({newKeyword:info.selectionText},function(response){});
            break;
          }
        }
      });
  });
}

//Creates the context menu, and runs the sendKeyword function once a keyword has been selected
chrome.contextMenus.create({
    title: "Add to DBot Database: %s", 
    contexts:["selection"], 
    onclick: sendKeyword,
});



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

function findEssayTitle(keyword, essays){
  console.log(keyword);
  console.log(essays);
  var final;
  var keywordRe = new RegExp(keyword, 'i');

  for (var i = 0; i < essays.length; i++) {
    var essay = essays[i].essay;
    console.log("Now looking through this essay: ", essay);
    if (essay.search(keywordRe) != -1) {
      console.log("Found a match for " + keyword + ": ", + essays[i].name);
      final = '<strong>' + essays[i].name + '</strong><br />';
      return final;
    } 
  }
  return "<strong>Unknown</strong><br />";
}


function extractContext(response, keywords, essays) {
  console.log("This is what we're extracting context from: ", response);
  var contextArr = [];
  var findKeyword;
  var essayTitle;
  var final;

  for (var i = 0; i < keywords.length; i++) {
    findKeyword = new RegExp('([^a-zA-Z]|\n|\r|\r\n)' + keywords[i] + '([^a-zA-Z]|\n|\r|\r\n)', 'g');

    if (response.search(findKeyword) != -1) {

      essayTitle = findEssayTitle(keywords[i], essays);
      var contextGrabber = response.match(new RegExp('\S{0,10}(\n|.){0,50}([^a-zA-Z]|\n|\r|\r\n)' + keywords[i] + '([^a-zA-Z]|\n|\r|\r\n)(\n|.){0,50}\S{0,10}', 'g')); //This RegEx finds the keyword, and on either side, adds a space (to capture only the whole word), and then captures all line breaks or characters 50 characters in either direction. Then, extends up to another 10 characters to finish at the nearest whole word
      
      //console.log("contextGrabber for the keyword " + keywords[i] + ": ", contextGrabber);
      //contextGrabber[0] = contextGrabber[0].replace(/(\r\n|\n|\r)/gm," / "); //Replaces line breaks with a space to prevent code from being broken
      final = essayTitle + contextGrabber[0];
      contextArr.push(final);
    }
  } 

  return contextArr;
}

//END DEFINING FUNCTIONS


//START LISTENERS AND DATA PROCESSING
//Set a listener that will capture the getProfile request of the popup and content from the content_script
var okcText = "";
var okcUserName = "";
var okcContext = "";

//Event handler for tab changes. Checks if current tab is the messages page on OKC. If so, initiates inbox scrape
chrome.tabs.onUpdated.addListener(function(tabId,changeInfo,tab){ 
  console.log("Tab has changed!");
  chrome.tabs.query({ currentWindow: true, active: true }, function (tabs) {
    console.log(tabs[0]);
    if (tabs[0].url == "http://www.okcupid.com/messages") {
      console.log("This URL is the messages page!");
      var tabId = tabs[0].id;

      //Send a message to the identified tab to scrape for messages
      chrome.tabs.sendMessage(tabId, {action:"scrapeMessages"},function(response){
        console.log("Sent a message off to the content script and receive a response! It was: ", response);
        //chrome.runtime.sendMessage({finalresult:"ready"},function(response){});
      });
   
    }  
  });
});


chrome.runtime.onMessage.addListener(function (msg, sender, sendResponse) {
  if(msg.content) {
    okcText = msg.content[0];
    okcUserName = msg.content[1];
    okcPicture = msg.content[2];
    okcContext = msg.content[3]; //This is an array of objects (essay title and essay)
    console.log(okcContext);
  }

  if(msg.method == "getProfile") {
    if (testEnvironment === false) {
      try {
        var profile = JSON.parse(localStorage["keywords"]);   
      } 
      catch(e) {
        console.log ("Warning! Error. Unable to parse localStorage['keywords']. Try saving your user settings again");
      }
      
    } else if (testEnvironment === true) {
      var profile = JSON.parse(localStorage["keywordsTestEnvironment"]);
    }     
    var pairs = profile.pairs;

    var desiredKeywords = []; 
    var desiredMessage = [];
    var finalKeywords, finalContext, okcResponse;
    var finalMessage = [];
    var finalResult = "";
    var opener = profile.opener;
    var closer = profile.closer;
    var firstTrans = profile.first_transition;
    var secondTrans = profile.second_transition;

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
      finalContext = extractContext(okcResponse,desiredKeywords, okcContext);

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
      finalResult += '"first_transition":"' + firstTrans + ' ",';
      finalResult += '"second_transition":"' + secondTrans + ' ",';
      finalResult += '"matched": [';

      for (var i = 0; i < finalKeywords.length; i++) {
          finalResult += '{"keyword":"' + finalKeywords[i] + '",';
          finalResult += '"context":"' + finalContext[i] + '",';
          finalResult += '"message":"' + finalMessage[i] + '",';

          if (i == 0 || i == 1) {
            finalResult += '"checked":true}';
          } else {
            finalResult += '"checked":false}';
          }

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

  if(msg.database) {
      var babeObj = msg.database;
      console.log(babeObj);
      sendResponse("background.js successfully received babeObj!");

      $.post("http://localhost:3000/newint", {"interaction": babeObj}, function(result){
        console.log("Posted the interaction to the local nodeJS server. The server wrote back: ", result);
      });

      $.post("http://dbotapp.appspot.com/int", {"interaction": babeObj, "username": "jrrera"}, function(result){
        console.log("Posted the interaction to the App Engine server. The server wrote back: ", result);
      });
  }

  if (msg.databaseKeywords) {
    var keywordObj = msg.databaseKeywords;
    console.log(keywordObj);
    
    sendResponse("background.js successfully received keywordObj!");

    $.post("http://localhost:3000/keywords", {"keywords": keywordObj}, function(result){
      console.log("Posted the keywords to the server. The result: ", result);
    });
  }

  if (msg.requestAllData) {
    $.post("http://localhost:3000/data", {"keywords": keywordObj}, function(result){
      console.log("Result of requesting all the data from the database:", result);
      sendResponse(result);
    });
    return true;
  }



  //This listener is triggered when a list of messages in your inbox is sent from the content script to background.js
  if(msg.messages) {
    var names = msg.messages;
    console.log(msg.messages);

    //Check to see if any messages were found. If yes, send a post request to server. 
    if (msg.messages == "Couldn't find any messages") {
      console.log(msg.messages)
    } else {
      // $.post("http://localhost:3000/messages", {"names": names}, function(result){
      //   console.log("Posted the list of names to the server. The result: ", result);
      // });        
      $.post("http://dbotapp.appspot.com/messages", {"names": names, "username": "jrrera"}, function(result){
        console.log("Posted the list of names to the server. The result: ", result);
      });        
    }
  }

  //Listener to grab current tab to make sure we don't do multiple rescans when one has already been done on the same profile
  if (msg.url) {
    console.log('msg.url listener has been initiated. Begin searching for current tab');
    chrome.tabs.query({ currentWindow: true, active: true }, function (tabs) {
      console.log('We found the current tab. It is this object:', tabs[0]);
      var okcTabId = tabs[0].id;
      var okcTab = tabs[0].url;
      sendResponse(okcTab);
    }); 
    return true;   
  }

  //Listener for porting the message from the extention into OKCupid's message box
  if (msg.portover) {
    var messageToPort = msg.portover;
    console.log('Time to port over!');
    chrome.tabs.query({ currentWindow: true, active: true }, function (tabs) {
      var okcTabId = tabs[0].id;
      var okcTab = tabs[0].url;
      chrome.tabs.sendMessage(okcTabId, {'portover':messageToPort},function(response){
        console.log("Sent a message off to the content script to port the message overand receive a response! It was: ", response);
      });
    }); 
  }

  // //DEPRECATEDThis listener is triggered when it receives the go-ahead from popup.js to scrape the messages page
  // if(msg.method == "triggerMessageScrape") {    
  // }  
});