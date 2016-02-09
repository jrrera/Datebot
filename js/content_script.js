/*
 * @desc: script for interaction with underlying okc page
 * @created: 10/19/2013
*/

(function(){
    console.log('Datebot Extension script injected!');

    chrome.extension.onMessage.addListener(function (msg, sender, sendResponse) {

        //Upon receiving a scrape command from the bg script, this will scrape the page, remove line breaks & unnecessary spaces, and send back as 'summary'
        if (msg.action === "scrape") {
            console.log("Scrape request received.");
            sendResponse($('body').html()); //Grab the HTML of the body, and send it back over to chrome extension
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
