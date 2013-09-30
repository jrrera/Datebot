/*
 * @desc: script for passing data between site and popup
*/
(function() {
  console.log('background loaded!');

  var babesQ = babesQ || [], //This array will hold the URLs to scrape
  scrapeLimit = 3; //This hard codes the limit of scrapes per session
  scrapeCount = 0; //Initializes counter at 0

  function sendScrapeRequest(url) {
    var profileName = url.match(/profile\/(.*)\?/i)[1], //Extracts the username from the URL
    payload = {}; //This is the JSON we'll be sending over
    
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
                setTimeout(function(){
                  scrapePage(babesQ);
                }, 8000); 

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

    if (msg.babesQ) {
      console.log('Received the babesQ', msg.babesQ);
      
      //If babesQ is new, push AND initialize scrapePage, else just add to the array, since function will be running already
      if (!babesQ.length) {

        msg.babesQ.forEach(function(url) {
          if (babesQ.indexOf(url) === -1) {
            babesQ.push(url);
          } 
        });

        scrapePage(babesQ);
      } else {

        msg.babesQ.forEach(function(url) {
          if (babesQ.indexOf(url) === -1) {
            babesQ.push(url);
          } 
        });
      }

    }
  });  
})(); //Invoke IIFE
