/*
 * @desc: script for interaction with underlying okc page  
 * @created:
*/

//console.log('Injected content script into the page!');

function scrapeThePage() {
  console.log('lets scrape the page!');

  var scrape = $('body').html();
  
  console.log('Here\'s what we scrape!', scrape);
  return scrape;
}

//I initialize the scraping process by creating a babesQ and returning 1 or more URLs to start scraping
function fillQueue() {
  //Initialize the array that will hold all of the links to scrape. 
  var babesQ = babesQ || [],
  link, result;

  //Grab all of the list items with a class of 'match', and then cycle through looking for the correct link
  $('.match').each(function(i, elem) {
    //console.log(i, elem, $(this));

    //Assign the anchor tag children to result
    result = $(this).children('a')[0];

    //If result is truthy (i.e. anchor tags were found), grab the href attribute
    if (result) {

      //Assign href to link
      link = result.href;      

      //Since we found a link, push it to the queue if not already there
      if (babesQ.indexOf(link) === -1) {
        babesQ.push(link);
      } 
    }

  });

  console.log(babesQ); 

  //Send the babesQ to the background page to open up a new tab
  chrome.runtime.sendMessage({babesQ: babesQ}, function(response) {});

}

function processLineBreaks(text) {
    var final;
    //Handling BR tags
    final = text.replace(/\s*<br><br>\s*/gi,"\n\n");

    final = final.replace(/\s*<p>\s*/gi,"");
    final = final.replace(/\s*<p ng-repeat="match in profile.matches.matched \| filter:{checked: true}" class="ng-scope ng-binding">\s*/gi,"");
    final = final.replace(/\s*<p.*ng-binding\">\s*/gi,"");

    final = final.replace(/\s*<br>\s*/gi,"\n");
    final = final.replace(/\s*<br \/><br \/>\s*/gi,"\n\n");
    final = final.replace(/\s*&lt;br \/&gt;\s*/gi,"\\n");

    final = final.replace(/\s*<\/p>\s*/gi,"\n\n");
    final = final.replace(/\s*<\/p>\s?<p>\s*/gi,"\n\n");
    
    final = final.replace(/<\!\-\- ngRepeat:.* \-\-\>/, "");
    return final;
}

function createScript(action) {
  var scriptNode;
  if (action === "openWindow") {
    scriptNode = document.createElement('script');
    scriptNode.textContent = "if(typeof Profile != 'undefined'){console.log('we good');} else {console.log('doesnt exist');} Profile.focusMessageCompose(); return false;";
    document.body.appendChild(scriptNode);
  } else if (action === "sendMessage") {
    scriptNode = document.createElement('script');
    scriptNode.textContent += "Profile.sendMessage(); console.log('The deed has been done');";
    document.body.appendChild(scriptNode);
  }
}

function checkForTextBox(message) {

  var findPage = $('#body_wrapper').length;

  if (findPage === 0) {
    console.log('Cannot find the dom elements. Trying again in 1 sec');
    setTimeout(function(){
      checkForTextBox(message);
    }, 1000); //Recursive

  } else {
    console.log('Found the dom');
    $('#message_text').text(message);
    $('#action_message').text(message);

    createScript('openWindow');
    setTimeout(function(){
      createScript('sendMessage'); //4 seconds after opening the message window, we send the message
    }, 4000);

    return 'success';
  }
}

$(document.body).on('click', '.sendmessage', function(){

  //console.log('Button was clicked!');
  var message, user, databaseData;
  
  //console.log($(this).siblings('.finalmessage').html());
  message = processLineBreaks($(this).siblings('.finalmessage').html());
  
  user = $(this).attr('id');
  
  //databaseData is what's going to be sent to the database after the message is sent. 
  databaseData = JSON.parse(processLineBreaks($('#'+user+"_data").html())); //This is the JSON that should be sent to the server upon successful send.
  databaseData.username = user;
  //console.log(databaseData);

  url = 'http://www.okcupid.com/profile/' + user;

  //console.log('message', message);
  //console.log('user', user);

  var portObj = {
    message: message,
    user: user,
    databaseData: databaseData
  };

  chrome.runtime.sendMessage({portover2: portObj}, function(response) {
    //console.log('message received and response set:', response);
  });

});

chrome.extension.onMessage.addListener(function (msg, sender, sendResponse) {
  if (msg.portover2) {
      console.log('Received command to send over a message. The message was:', msg.portover2.message);
      
      //If the textbox was found and scripts deployed, this will return success
      if (checkForTextBox(msg.portover2.message) === 'success') {
        sendResponse(msg.portover2.user);
      };
  }

  if (msg.user) {
    console.log('Received a response from the background script after sending a message! It was', msg.user);
    //Now, we inject a script to execute window function created by an Angular service to get this data in Angular's ecosystem. 
    //Typically not accessible by content script, hence using script tag injection workaround
    scriptNode = document.createElement('script');
    scriptNode.textContent = "window.addSuccess('" + msg.user + "')";

    console.log('user', msg.user);
    console.log('Code to be run:', scriptNode.textContent);
    
    document.body.appendChild(scriptNode);

  }

  if (msg.needScrapes) {
    console.log('Looks like you need some scrapes, eh?');

    fillQueue();  //Fills up the babesQ with more scrapes before scraping the page
    
    var result = scrapeThePage();
    sendResponse({html: result});
  }

  //This is the message initiated by the popup to start scraping. 
  if(msg.initialize) {
    sendResponse('got it!');
    console.log('received a message from popup to initialize scrape!')
    fillQueue();  //Fills up the babesQ with more scrapes
  }

});




