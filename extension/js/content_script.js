/*
 * @desc: script for interaction with underlying okc page  
 * @created: 10/19/2013
*/

(function(){
    console.log('Datebot Extension script injected!');

    function createScript(action, composer) {
      //This function injects scripts into the OKC dom through the Content Script
      var scriptNode;

      if (action === "openWindow") {
        scriptNode = document.createElement('script');

        // Open the composer window for main composer and action composer
        scriptNode.textContent = "Profile.focusMessageCompose(); Profile.toggleActionCompose('on');";

        // Inject script
        document.body.appendChild(scriptNode);

      } else if (action === "sendMessage") {
        scriptNode = document.createElement('script');
        
        // Trigger the appropriate window on the page based on which message composer is open
        if (composer === 'action_message') {
          scriptNode.textContent = "Profile.actionSendMessage(); console.log('Message sent');";  
        } else {
          scriptNode.textContent = "Profile.sendMessage(); console.log('Message sent');";  
        }
        
        // Inject the script into the page
        document.body.appendChild(scriptNode);
      }
    }

    chrome.extension.onMessage.addListener(function (msg, sender, sendResponse) {

        //Upon receiving a scrape command from the bg script, this will scrape the page, remove line breaks & unnecessary spaces, and send back as 'summary'
        if (msg.action === "scrape") {
            console.log("Scrape request received.");
            sendResponse($('body').html()); //Grab the HTML of the body, and send it back over to chrome extension
        }

        //This indicates that we've clicked 'Send the Message' in the Chrome extension and received the final draft of the message, so we place the message in the appropriate divs, and execute a script to run the send message functionality
        if (msg.finalmessage) {
          // Declare offset from top of page, and a container for which message composer to work with
          var scrollTop = $(window).scrollTop(),
              messageWindow; //Used to tell the script which message composer to trigger

          //Open the window composer on OKC
          createScript('openWindow');
           
          //2 seconds after opening the message window, we populate the container and send the message
          setTimeout(function(){
            if (scrollTop > 486) {
              // If we're too far down the page, we need to use the action_message container instead
              $('#action_message').val(msg.finalmessage.message);
              messageWindow = 'action_message';
              console.log('sending via action_message window');  
            } else {
              $('#message_text').val(msg.finalmessage.message);  
              messageWindow = 'message_text';
              console.log('sending via standard message_text window');
            }
            createScript('sendMessage', messageWindow); 
          }, 2000);

          sendResponse({status:'success'});
        }

        //This is the listener for the command to scrape received messages from the OKC inbox, and send back as an array
        if (msg.action == "scrapeMessages") {
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
                chrome.runtime.sendMessage({messages: namesArr}); //Passes the matched keywords as the final result. Will soon update to pass a JSON object
            } else {
                chrome.runtime.sendMessage({messages: "Couldn't find any messages"});
            }
        }
    });
})(); //IIFE
