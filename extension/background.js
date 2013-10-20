/*
* @desc: script for passing data between site and popup
 @created: 10/19/2013
*/
  var testEnvironment = false;

  //Playground for context menu

  //Opens the options page so that the .js can run on that page. Once that's create, callback function sends a message containing the keyword
  //that the options page can grab

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
        url: "chrome-extension://" + extId + "/options/interests.html",
        active: false
    }, function(){
        chrome.tabs.query({}, function (tab){ //This is necessary to make sure the page fully loads in the browser before the message is sent
          for(var i =0; i < tab.length; i++) {
            if (tab[i].url === "chrome-extension://" + extId + "/options/interests.html") {
              console.log("Looks like the page has loaded. Sending the message!");
              sendKeywordMessage(info.selectionText); //Recursive function that sends the message until response is received
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

    if (msg.portover3) {
      var messageToPort = msg.portover3;
      console.log('Processed message received', messageToPort);

      chrome.tabs.query({ currentWindow: true, active: true }, function (tabs) { 
        var tabId = tabs[0].id;
                  
        //Send a request to the content script on the OKCupid page to scrape the HTML
        chrome.tabs.sendMessage(tabId, {finalmessage: messageToPort},function(response){});
      });         
    }

    if(msg.method == "triggerScript") {
      chrome.tabs.query({ currentWindow: true, active: true }, function (tabs) { 
        var tabId = tabs[0].id;
        
        console.log("Was able to get the current tab: ", tabs[0], 'let us send a message!');
        
        //Send a request to the content script on the OKCupid page to scrape the HTML
        chrome.tabs.sendMessage(tabId, {action:"scrape"},function(response){
          var html = response;
          console.log("Sent a message off to the content script and receive a response! It was: ", html);
          
          //Send the response, which is the HTML payload, back to the Angular front-end in the pop
          chrome.runtime.sendMessage({html: html},function(response){});
        });
      });         
    }

    if(msg.database) {
        var babeObj = msg.database;
        console.log(babeObj);
        sendResponse("background.js successfully received babeObj!");

        $.post("http://dbotapp.appspot.com/int", {"interaction": babeObj, "username": "jrrera"}, function(result){
          console.log("Posted the interaction to the App Engine server. The server wrote back: ", result);
        });
    }

    if (msg.databaseKeywords) {
      var keywordObj = msg.databaseKeywords;
      console.log(keywordObj);
      
      sendResponse("background.js successfully received keywordObj!");

      $.ajax({
          type: 'POST',
          url: 'http://dbotapp.appspot.com/keywords',
          data: JSON.stringify({
            "username":"jrrera",
            "keywords": keywordObj,
           }),
          contentType: 'application/json',
          success: function(data,textStatus, jqXHR) {
              console.log('POST response: ');
              console.log(data);
          }
      });  
    }

    if (msg.request == "appengine_keywords") {
      $.get("http://dbotapp.appspot.com/keywords", function(result){
        
        try {
          var aeJson = JSON.parse(result);
          sendResponse(aeJson);  
        } catch (e) {
          console.log('Warning! Could not parse App Engine\'s JSON! The error:', e);
          sendResponse('Warning! Could not parse App Engine\'s JSON! The error:', e);
        }
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
  });
