/**
 * Opens the options page. Once opened create, callback function sends
 * a message containing the keyword that the options page can grab.
 */ 
function sendKeywordMessage(selectionText) {
  chrome.runtime.sendMessage({"newKeyword":selectionText},function(response){
    if (!response) {
      console.log("Options page hasn't received it. Resending message!");
      sendKeywordMessage(selectionText);
    } else {
      console.log("Keyword successfully received by options page.");
    }
  });
}

function sendKeyword(info,tab) {
  var extId = chrome.i18n.getMessage("@@extension_id"); //Gets the extension ID for opening the options page. Not required for creating the tab, but required for checking to see if the URL is open
  console.log("Word " + info.selectionText + " was clicked.");
  chrome.tabs.create({ 
      url: "chrome-extension://" + extId + "/components/options/interests.html",
      active: false
  }, function(){
      chrome.tabs.query({}, function (tab){ //This is necessary to make sure the page fully loads in the browser before the message is sent
        for(var i =0; i < tab.length; i++) {
          if (tab[i].url === "chrome-extension://" + extId + "/components/options/interests.html") {
            console.log("Looks like the page has loaded. Sending the message!");
            sendKeywordMessage(info.selectionText); //Recursive function that sends the message until response is received
            break;
          }
        }
      });
  });
}

function updateInteractionRecords(interactionsObj, messageArr) {
  for(var i = 0; i < messageArr.length; i++) {
    // Is there a matching record in the interaction object when we pass in 
    // an okcupid username?
    if (interactionsObj[messageArr[i]]) {
      //If so, add a respnse = true attribute
      interactionsObj[messageArr[i]].response = true;
    }
  }
  return JSON.stringify(interactionsObj); //Return the stringified object
}

//Creates the context menu, and runs the sendKeyword function once a keyword has been selected
chrome.contextMenus.create({
    title: "Add to DBot Database: %s", 
    contexts:["selection"], 
    onclick: sendKeyword,
});

//Event handler for tab changes. Checks if current tab is the messages page on OKC. If so, initiates inbox scrape
chrome.tabs.onUpdated.addListener(function(tabId,changeInfo,tab){ 
  console.log("Tab has changed!");
  chrome.tabs.query({ currentWindow: true, active: true }, function (tabs) {
    console.log(tabs[0]);
    if (tabs[0].url == "http://www.okcupid.com/messages" || tabs[0].url == "http://www.okcupid.com/mailbox?folder=1") {
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

  if (msg.datebotMessage) {
    var messageToPort = msg.datebotMessage;
    var userId = msg.userId;
    console.log('Processed message received', messageToPort.message, 'for user ID', messageToPort.userId);

    chrome.tabs.query({ currentWindow: true, active: true }, function (tabs) { 
      var tabId = tabs[0].id;
      var dataToPass = {
        finalmessage: messageToPort.message,
        userId: messageToPort.userId
      };
                
      //Send a request to the content script on the OKCupid page to scrape the HTML
      chrome.tabs.sendMessage(tabId, dataToPass, function(response){
          //Upon response from content script, if it was a success, pass this info back to popup.
          if (response.status === 'success') {
              console.log('Received success response from tab after message sent. Passing to popup...');
              sendResponse({status:'message_sent'});
              //return true; //Required by Chrome framework after acting on a listener response
          }
      });
    });         
  }

  if(msg.method == "triggerScript") {
    chrome.tabs.query({ currentWindow: true, active: true }, function (tabs) { 
      var tabId = tabs[0].id;
      
      console.log("Was able to get the current tab: ", tabs[0], 'let us send a message!');
      
      //Send a request to the content script on the OKCupid page to scrape the HTML
      chrome.tabs.sendMessage(tabId, {action:"scrape"},function(response){
        var html = response;
        //console.log("Sent a message off to the content script and receive a response! It was: ", html);
        
        //Send the response, which is the HTML payload, back to the Angular front-end in the pop
        chrome.runtime.sendMessage({html: html},function(response){});
      });
    });         
  }


  // This listener is triggered when a list of messages in your inbox is sent from 
  // the content script to background.js
  if(msg.messages) {
    //Check to see if any messages were found. If yes, update interactions object in localStorage
    if (msg.messages === "Couldn't find any messages") {
      console.log(msg.messages);
      return;
    } else {
      //Grab interaction history object from localStorage
      var dbotInteractions = JSON.parse(localStorage["dbotInteractions"]);

      // Run the interactions object through updateInteractionRecords, which updates the response
      // attribute on each interaction and returns the updated objected, stringified
      localStorage["dbotInteractions"] = updateInteractionRecords(dbotInteractions, msg.messages);
      return true; //Required by Chrome framework to keep async requests alive.
    }
  }

  // Listener to grab current tab to make sure we don't do multiple rescans when 
  // one has already been done on the same profile
  if (msg.url) {
    console.log('msg.url listener has been initiated. Begin searching for current tab');
    chrome.tabs.query({ currentWindow: true, active: true }, function (tabs) {
      console.log('We found the current tab. It is this object:', tabs[0]);
      var okcTabId = tabs[0].id;
      var okcTab = tabs[0].url;
      sendResponse(okcTab);
    }); 
    return true;   //Required by Chrome framework to keep async requests alive.
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
  return true;  //Required by Chrome framework to keep async requests alive.
});
