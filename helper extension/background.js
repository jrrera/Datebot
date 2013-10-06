/*
 * @desc: script for passing data between site and popup, and posting data to App Engine
*/
(function() {
  console.log('background loaded!');

  var babesQ = babesQ || [], //This array will hold the URLs to scrape
  scrapeLimit = 5, //This hard codes the limit of scrapes per session
  scrapeCount = 0; //Initializes counter at 0

  //Relays the message from the popup to the content script to initiate the scrape for the first time. 
  function initializeScrape(okcTabId) {
    chrome.tabs.sendMessage(okcTabId, {'initialize': 'gogogo'},function(response){
      if (!response) {
        console.log("OKC page hasn't received it. Resending message object in .5 seconds!");
        setTimeout(function(){
          initializeScrape(okcTabId);
        }, 500);
      } else {
        console.log("Success!", response);
      }
    });
  }

  //While the scrape process is in motion, I take the first entry of the babesQ, open it in a new tab, and send the scrape request there. 
  function scrapePage(babesQ) {
    console.log('Scrape page function loaded!', babesQ);
    var url = babesQ[0];

    chrome.tabs.create({ 
        url: url,
        active: true
    }, function(){
        sendScrapeRequest(url);
    });
  }

  //I do the heavy lifting in passing the scrape request to the URL and sending the results to the server
  //Once done, I check to see if the array has results left. If so, I call scrapePage() again
  function sendScrapeRequest(url) {
    var profileName = url.match(/profile\/(.*)\?/i)[1], //Extracts the username from the URL
    payload = {}, //This is the JSON we'll be sending over
    timeout;
    
    console.log(profileName);

    chrome.tabs.query({}, function (tab){ //This is necessary to make sure the page fully loads in the browser before the message is sent
      for (var i =0; i < tab.length; i++) {

        if (tab[i].url === url) {
          
          okcTabId = tab[i].id;
          chrome.tabs.sendMessage(okcTabId, {'needScrapes': true},function(response){
            if (response) {

              babesQ.splice(0, 1); //Remove the URL from the array
              console.log('Received the page! Now we need to send this to the server!');

              payload.profile_name = profileName;
              payload.user = 'jrrera@gmail.com'; //For MVP, hardcoding this
              payload.html = response.html;

              $.ajax({
                  type: 'POST',
                  url: 'http://localhost:8080/getscrapes',
                  data: JSON.stringify(payload),
                  contentType: 'application/json',
                  success: function(data,textStatus, jqXHR) {
                      console.log('POST response for profile scrapes: ');
                      console.log(data);
                  }
              });  

              
              //If there are still items in the babesQ, call the scrapePage function again 10 seconds later
              if (babesQ.length && (scrapeCount < scrapeLimit)) {
                console.log('Still matches in the queue. Restarting scrapePage function...');

                scrapeCount += 1;
                timeout = Math.random() * (20000 - 4000) + 4000; //This randomizes the number of milliseconds between 4000 and 20000 to better simulate normal behavior                
                
                console.log('Scraping again in ' + timeout + ' milliseconds.');

                setTimeout(function(){
                  scrapePage(babesQ);
                }, timeout); 

              } else {
                console.log('Either the array is empty or you hit your scrape limit! Ending', babesQ.length, scrapeCount);
              }

            } else {
              //Since no response, try again in 1 second
              setTimeout(function(){
                sendScrapeRequest(url);
              }, 1000);
            }

          });

          break;
        } 

      }
    });
  }


  ////The below two functions are related to passing the final message to OKC
  //A function that updates the dom of the Datebot Web App upon completion of sending the okc message
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

  //A function that calls itself recursively as it attempts to pass a message to the OKC page containing the message you want to send
  function sendMessage(okcTabId, messageObj) {
    chrome.tabs.sendMessage(okcTabId, {'portover2': messageObj},function(response){
      if (!response) {
        console.log("OKC page hasn't received it. Resending message object in .5 seconds!");
        setTimeout(function(){
          sendMessage(okcTabId, messageObj);
        }, 500);
      } else {
        console.log("Response", response);
        relaySuccess(response); //Sends the username to another function that will pass back success to Datebot Web App
      }
    });
  }
  ////End functions that pass the final message

  //Listeners
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

    //Message from popup to initiate the scraping process
    if (msg.action === "triggerScrape") {
      chrome.tabs.create({ 
          url: "http://www.okcupid.com/match",
          active: true
      }, function(){
          chrome.tabs.query({}, function (tab){ //This is necessary to make sure the page fully loads in the browser before the message is sent
            for(var i =0; i < tab.length; i++) {
              if (tab[i].url === "http://www.okcupid.com/match") {
                console.log("Looks like the OKC page has loaded. Requesting the scrape!");
                okcTabId = tab[i].id;
                initializeScrape(okcTabId); //Recursive function that sends the message to intialize the scraping process until response is received
                break;
              }

            }
          });
      });
    }
    
    //Used for scraping. If we receive a queue of babes to scrape, we run the scrapePage function.
    if (msg.babesQ) {
      console.log('Received the babesQ', msg.babesQ);
      
      //If babesQ is new (length of zero), push a babe in there AND initialize scrapePage...
      //else just add new babe to the array, since function will be running recursively already
      if (!babesQ.length) {

        //Cycle through the babesQ array. If cannot find that URL in the babesQ array already, push it in. Else, do nothing.
        msg.babesQ.forEach(function(url) {
          if (babesQ.indexOf(url) === -1) {
            babesQ.push(url);
          } 
        });

        //Run the scrapePage function, passing in the babesQ array.
        scrapePage(babesQ);
      
      } else {

        //Since the scrapePage function is currently running, simply add new profiles to the babesQ
        msg.babesQ.forEach(function(url) {
          if (babesQ.indexOf(url) === -1) {
            babesQ.push(url);
          } 
        });
      }
    } //Closes the if (msg.babesQ) statement

  }); //Closes chrome listener

})(); //Invoke IIFE
