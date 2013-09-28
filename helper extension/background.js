/*
 * @desc: script for passing data between site and popup
*/
console.log('background loaded!');

function relaySuccess(user) {
  chrome.tabs.query({}, function (tab){ 
    for(var i =0; i < tab.length; i++) {
      if (tab[i].url === "http://localhost:8080/static/index.html") { //This will eventually be the real Datebot URL
        console.log("Found the Datebot App. Sending success message over!");
        dbotTabId = tab[i].id;
        chrome.tabs.sendMessage(dbotTabId, {'user': user},function(response){});
        break;
        //Will also eventually have to send this to the server for safe keeping. This is just to update the DOM.
      }
    }
  });
}

function sendMessage(okcTabId, messageObj) {
  chrome.tabs.sendMessage(okcTabId, {'portover2': messageObj},function(response){
    if (!response) {
      console.log("OKC page hasn't received it. Resending message object in .5 seconds!");
      setTimeout(function(){
        sendMessage(okcTabId, messageObj);
      }, 500);
    } else {
      console.log("Response", response);
      console.log("Keyword successfully received by options page.");
      relaySuccess(response); //Sends the username to another function that will pass back success to Datebot Web App
    }
  });
}

chrome.runtime.onMessage.addListener(function (msg, sender, sendResponse) {
  //Listener for porting the message from the extention into OKCupid's message box
  if (msg.portover2) {
    console.log('message received');

    var messageToPort = msg.portover2;

    chrome.tabs.create({ 
        url: "http://www.okcupid.com/profile/" + messageToPort.user,
        active: false
    }, function(){
        chrome.tabs.query({}, function (tab){ //This is necessary to make sure the page fully loads in the browser before the message is sent
          for(var i =0; i < tab.length; i++) {
            if (tab[i].url === "http://www.okcupid.com/profile/" + messageToPort.user) {
              console.log("Looks like the OKC page has loaded. Sending the message!");
              okcTabId = tab[i].id;
              sendMessage(okcTabId, messageToPort); //Recursive function that sends the message until response is received
              break;
            }

          }
        });
    });
  }
});