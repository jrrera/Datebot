/*
 * @desc: script for passing data between site and popup
*/
console.log('background loaded!');


function sendMessage(okcTabId, message) {
  chrome.tabs.sendMessage(okcTabId, {'portover2': message},function(response){
    if (!response) {
      console.log("OKC page hasn't received it. Resending message!");
      sendMessage(okcTabId, message);
    } else {
      console.log("Keyword successfully received by options page.");
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
              sendMessage(okcTabId, messageToPort.message); //Recursive function that sends the message until response is received
              break;
            }

          }
        });
    });
  }
});