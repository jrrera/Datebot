/*
 * @desc: Script for handling click to initiate script
 * @created: Jon Gu
*/

$(function(){
    var testEnvironment = false;
    var DEBUG = window.DEBUG = true;
    var DateBot = window.DateBot || {};

    console.log("chrome::", window.chrome, "datebot::", DateBot);

    var self = this;

    //jQuery event handling for clicking on the "Scan Page" button when on an OKC profile
    $("#initiate_scrape").click(function() {
        console.log("Scrape has been initated.")

        //First, we send a runtime message to the background script. Then, we add a listener for the result back the content and background scripts. 
        window.chrome.runtime.sendMessage({action:"triggerScrape"},function(response){});
        
        window.chrome.runtime.onMessage.addListener(function (msg, sender, sendResponse) {
            console.log('Received a message from background script! It was', msg);
        });  
    });
});
