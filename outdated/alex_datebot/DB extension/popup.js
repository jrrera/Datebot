var self = this;
var checkedKeywords = [];
var messageCopy;
var defaultMessage = "<p>Hey, how\'s it going? Just wanted to let you know that your profile is pretty awesome &ndash; very well written. Do you write in your spare time?<br /><br />Jon</p>";

var processKeywords = function(keywords) {     
  // Creates the checkboxes for the keywords. API sorts in order of priority, so by default, picks the first two to be pre-checked
  var keywordList = "";
  var progressBar;
  var progressBarText;
  for (var k = 0; k < keywords.matched.length; k++) {
    console.log("keywords in processKeywords function: " + keywords);
    if (k === 0 || k === 1) {
      checkedcheck = 'checked="checked"';  // Inserts the pre-checked status to first two keywords
      checkedKeywords.push(keywords.matched[k].keyword); // Stores pre-checked keywords into an array
    } else {
      checkedcheck = '';
    }
       keywordList += '<input data-user="' + keywords.user + '" class="' + keywords.user + '" id="' + keywords.user + '-' + keywords.matched[k].keyword + '" type="checkbox" name="' + keywords.matched[k].keyword + '" value="' + keywords.matched[k].keyword + '" ' + checkedcheck + '>' + keywords.matched[k].keyword + '</input><br />';
  }

  if (k === 0) {
    $("#the-progress-bar").css('display', 'none');
  } else if (k === 1) {
    progressBar = '20%';
    progressBarText = "Not the best match...";
  } else if (k===2) {
    progressBar = '40%';
    progressBarText = "Might have a bit in common?";
  } else if (k===3) {
    progressBar = '60%';
    progressBarText = "Looks like a possible good match!.";
  } else if (k===4) {
    progressBar = '80%';
    progressBarText = "Nice! Looks like a great match.";
  } else if (k >= 5) {
    progressBar = '100%';
    progressBarText = "Duuude, we have a winner!";
  }
    
  if (k != 0) {
    $("#the-progress-bar-2").css('width', progressBar);
    $('#the-progress-bar-2').text(progressBarText);
  }
  return(keywordList);
};

/*
var processContext = function(keywordcontext) {
  //Processes the context around each keyword to be used in the listEmOut() function
  //Alex recommended using RegEx to identify keyword and wrap it in a span tag that styles it in blue
  var keywordContextList = "";
  console.log("keywordcontext: " + keywordcontext);
  for (var k = 0; k < keywordcontext.matched.length; k++) {
    keywordContextList += "<li>" + keywordcontext.matched[k].context + "</li><br />";
  }
  return(keywordContextList);
};
*/

var processContext = function(keywords) {
  //Processes the context around each keyword to be used in the listEmOut() function
  //Alex recommended using RegEx to identify keyword and wrap it in a span tag that styles it in blue
  var keywordContextList = "";
  var keywordReg;

  for (var k = 0; k < keywords.matched.length; k++) {
    keywordContextList += "<li>" + keywords.matched[k].context + "</li><br />";
    console.log("keywords.matched[k].context: ", keywords.matched[k].context);
  } //Creates the <li> context list

  for (k = 0; k < keywords.matched.length; k++) {
    keywordReg = new RegExp('[^a-zA-Z]' + keywords.matched[k].keyword + '[^a-zA-Z]', 'g'); 
    keywordContextList = keywordContextList.replace(keywordReg, '<span class="bluekeywords">' + keywordReg.exec(keywordContextList) + '</span>');
  } //Does a find and replace for the keywords and replaces in blue. Uses RegEx to find the correct keyword in event of similar keywords (i.e. cook vs. cooking)

  return(keywordContextList);
};

var processMessage = function(keywordmessage) {
  //Processes the message to be used in the listEmOut() function
  
  //console.log("Beginning processMessage. Here's the keywordmessage: ", keywordmessage);

  var leadIn;
  var finalMessage = "";
  var fullArray = [];
  
  for (var k = 0; k < keywordmessage.matched.length; k++) {
    if (keywordmessage.matched[k].keyword == checkedKeywords[k]){
      fullArray.push(keywordmessage.matched[k].message);
    }
      
  }
  for (var l = 0; l < fullArray.length; l++) {
    if (l === 0) {leadIn = keywordmessage.opener;} else if (l===1){leadIn = "Also, ";} else {"Oh, and ";}
    finalMessage += "<p>" + leadIn + fullArray[l] + "</p>";
  }
  checkedKeywords = []; //resets checkedKeywords for the next iteration
  finalMessage += '<p>'+ keywordmessage.closer + '</p>'
  return(finalMessage);
};

var listEmOut = function(babesArr){           
  //generate the table entry using all of the functions above
  //Will probably want to break this into more digestible functions at some point
  var babeOutput = "";


  babeOutput += '<tr class="' + babesArr.user +'">';
  babeOutput += '</td><td class="keywords"> <form name="keywordform"> ' + processKeywords(babesArr) + ' </form> </td>';
  babeOutput += '<td class="context"> <ul> ' + processContext(babesArr) + ' </ul> </td><td class="message" id="' + babesArr.user + '"><div class="capturemessage" id="' + babesArr.user + 'message"> ' + processMessage(babesArr) + '</div><!--<button class="edit">Edit</button><textarea wrap="hard"></textarea><button class="save">Save</button>--></td>';
  babeOutput += '</tr>'
  
  $('#gtable > tbody').append(babeOutput);
  $('#picture').html('<img width="100px" src="' + babesArr.pic + '"><br />');
  //console.log(babeOutput);
};
  
var setEventListeners = function(babes) {
  $('input.reject').click(function(){
      if($(this).is(':checked')){
        var babeToReject = $(event.target).attr('name').replace("reject ","");
          if (confirm("Are you sure you want to reject? She might be pretty cool.")) {
            $('tr.'+babeToReject).hide(); 
          } else {
            $(this).prop('checked', false);
          }
          //Also need to push reject status to database
      }
  });

  $('input.manual').click(function(){
      if($(this).is(':checked')){
        var babeManuallyMessaged = $(event.target).attr('name').replace("manuallymessaged ","");
          if (confirm("Click OK to confirm that you manually messaged this girl.")) {
            $('tr.'+babeManuallyMessaged).hide(); 
          } else {
            $(this).prop('checked', false);
          }
          //Also need to push manually messaged status to database
      }
  });
};


$("#initate").click(function() {
  chrome.runtime.sendMessage({method:"triggerScript"},function(response){});
  chrome.runtime.onMessage.addListener(function (msg, sender, sendResponse) {
    if (msg.finalresult == "ready") {
      console.log("Asynchronous call was successful!");
      if ($('#picture').html().length > 0) {
        console.log("Has already run!");
      } else {
        //Sends a message to the background.js file with the method "getProfile". Once it receives a response, updates the DOM of the chrome extension
        chrome.runtime.sendMessage({method:"getProfile"},function(response){
        
          if (!response) {
            $('#info').html('<span style="color:red;">Can\'t find any profiles on this page. Are you on an OKCupid profile right now? If so, refreshing the page should fix this error</span>');
          } else {
            $('#robot').slideUp('slow');
            console.log("response: ", response);
            console.log("babesArray: ", babesArray);
            var babesArray = JSON.parse(response);
          }
          if (babesArray.matched.length != 0) {
            $('#gtable').slideDown('slow');
          } else {
            $('#info').html('<p style="color:DarkRed;">Looks like this girl has nothing in common with you based on your keywords. Bummer. Try this default message on for size:</p><div style="border-style:dotted; padding:5px;">' + defaultMessage + '</div>');
          }
          
          $('#the-progress-bar').css('display', 'block');

          listEmOut(babesArray);
          setEventListeners(babesArray);

          //Create message-updating functionality
          var updateMessage = function(babesArr) {
                $('input').click(function(event){  //Captures all of the checked boxes that match the class of the box checked or unchecked
                  var clickedName = $(event.target).attr('class');
                  var valuesArr = $('input:checkbox:checked.' + clickedName).map(function () { 
                    return this.value;
                    }).get();

                  //Process the new message
                  var leadIn;
                  var finalMessage = "";
                  var fullArray = [];
                  var finalMessageUpdate = "";
                  var arrNumber; //This will store the position of the clickedName in the JSON file
                  var babeToUpdate; //This will be a shortcut for which babe should be updated once identified with arrNumber
                  
                  //This new function should find the number in the array based on the username (i.e. clickedName), 
                  //and then cycle through the keywords that are found in valuesArr 
                  
                  arrNumber = 0;
                  babeToUpdate = babesArr.matched;
                  
                  for (var k = 0; k < babeToUpdate.length; k++) {
                    if ($.inArray(babeToUpdate[k].keyword, valuesArr) != -1) {
                      fullArray.push(babeToUpdate[k].message);
                    } 
                  } //Cycles through keywords, identifies which are in the valuesArr, and pushes the associated message to fullArray
                  if (fullArray.length != 0){              
                    for (var l = 0; l < fullArray.length; l++) {
                      if (l === 0) {leadIn = babesArr.opener + " ";} else if (l===1){leadIn = "Also, ";} else {leadIn = "Oh, and ";}
                      finalMessageUpdate += "<p>" + leadIn + fullArray[l] + "</p>";
                    } //Generates the final message
                    finalMessageUpdate += '<p>' + babesArr.closer + '</p>';
                  } else {
                    finalMessageUpdate = '<p><span style="color:DarkRed;">Note: No interests selected. Below is a default message</span></p>'; 
                    finalMessageUpdate += defaultMessage;
                  }        
                  $('#'+clickedName+'message').html(finalMessageUpdate); //Now, identify the correct td to replace with new HTML

              }); 

              //This is where we can manually edit shit. Taken from: http://www.tonylea.com/2010/jquery-easy-editable-text-fields/
              
              /*       
              $('.edit').click(function(){
                $(this).next().val($(this).prev().html());
                $(this).hide();
                $(this).prev().hide();
                $(this).next().show();
                $(this).next().next().show();
                $(this).next().select();

                  $('textarea').blur(function() { //When you click Save, or navigate from the text box, restore normal display
                         console.log("Your text box just lost focus!");
                         if ($.trim(this.value) == ''){
                       this.value = (this.defaultValue ? this.defaultValue : '');
                     }
                     else{
                       $(this).prev().prev().html(this.value);
                     }
                 
                     $(this).hide();
                     $(this).prev().show();
                     $(this).prev().prev().show();
                     $(this).next().hide();


                  });
              });
              */
          };

          updateMessage(babesArray);

        });
      } //Ends the else statement for the image check
    } //End the if statement for msg.finalresult
  });  
});


//Create options page for keyword, message pairs!
