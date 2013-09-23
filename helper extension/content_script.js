/*
 * @desc: script for interaction with underlying okc page  
 * @created:
*/

console.log('Injected content script into the page!')

function processLineBreaks(text) {
    var final;
    //Handling BR tags
    final = text.replace(/\s*<br><br>\s*/gi,"\n\n");

    final = final.replace(/\s*<p>\s*/gi,"");
    final = final.replace(/\s*<p ng-repeat="match in profile.matches.matched \| filter:{checked: true}" class="ng-scope ng-binding">\s*/gi,"");
    final = final.replace(/\s*<p.*ng-binding\">\s*/gi,"");

    final = final.replace(/\s*<br>\s*/gi,"\n");
    final = final.replace(/\s*<br \/><br \/>\s*/gi,"\n\n");

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
      createScript('sendMessage'); //2 seconds after opening the message window, we send the message
    }, 2000);

  }
}

$(document.body).on('click', '.sendmessage', function(){

  console.log('Button was clicked!');
  var message, user;
  
  console.log($(this).siblings('.finalmessage').html());
  message = processLineBreaks($(this).siblings('.finalmessage').html());
  
  user = $(this).attr('id');
  url = 'http://www.okcupid.com/profile/' + user;

  console.log('message', message);
  console.log('user', user);

  var portObj = {
    message: message,
    user: user
  }

  chrome.runtime.sendMessage({portover2: portObj}, function(response) {
    //console.log('message received and response set:', response);
  });

});

chrome.extension.onMessage.addListener(function (msg, sender, sendResponse) {
  if (msg.portover2) {
      console.log('Received command to send over a message. The message was:', msg.portover2);
      checkForTextBox(msg.portover2);
  }
});
