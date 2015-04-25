/*
 * @desc: script for interaction with underlying okc page  
 * @created: 10/19/2013
*/

(function(){
  console.log('Datebot Extension script injected!');

  function createScript(action, userId) {
    //This function injects scripts into the OKC dom through the Content Script
    var scriptNode;
    console.log('userId in content script', userId);

    if (action === "openWindow") {
      scriptNode = document.createElement('script');

      // Open the composer window for main composer and action composer
      scriptNode.textContent = "jQuery('#actions a').trigger('click');";
      document.body.appendChild(scriptNode);

    } else if (action === "sendMessage") {
      scriptNode = document.createElement('script');

      // Activate the method on the page for sending messages
      scriptNode.textContent = "jQuery('.compose button').trigger('click'); console.log('Message sent');";  
      document.body.appendChild(scriptNode);
    }
  }

  chrome.extension.onMessage.addListener(function (msg, sender, sendResponse) {

    if (msg.action === "scrape") {
      console.log("Scrape request received.");
      sendResponse($('body').html()); 
    }

    // This indicates that we've clicked 'Send the Message' in the Chrome 
    // extension and received the final draft of the message, so we place 
    // the message in the appropriate divs, and execute a script to run the 
    // send message functionality.
    if (msg.finalmessage) {
      
      // Because of new OKC dom updates, need to scroll to top of page before 
      // sending the message.
      window.scrollTo(0,0);

      // Open the window composer on OKC page
      setTimeout(function(){
        createScript('openWindow', msg.userId);
      }, 500);

      // Next, we populate the container and send the message
      setTimeout(function(){
        console.log(msg);
        console.log('the element we need', $('#message_' + msg.userId));
        $('#message_' + msg.userId).val(msg.finalmessage);
        createScript('sendMessage', msg.userId);
      }, 4000);

      sendResponse({status:'success'});
    }

    // This is the listener for the command to scrape received messages 
    // from the OKC inbox, and send back as an array
    if (msg.action === "scrapeMessages") {
      var namesArr = [],
          pattern = /(We chose each other!|It's a match!)/i;
      
      console.log("The content_script has been injected!");

      $('.unreadMessage, .readMessage, .repliedMessage, .filteredReadMessage').each(function(){
          var text = $(this).text();
          if (text.search(pattern) === -1) {
              namesArr.push(($(this).find('.subject').text()));
          }
      });
      console.log("Final namesArr: ", namesArr);
      sendResponse("Messages scraped");
      if (namesArr.length > 0) {
        // Passes the matched keywords as the final result. 
        // Will soon update to pass a JSON object
        chrome.runtime.sendMessage({messages: namesArr}); 
      } else {
        chrome.runtime.sendMessage({messages: "Couldn't find any messages"});
      }
    }
  });
})(); //IIFE
