var testEnvironment = true;

//localStorage["xp"] = 960; //Uncomment this if you need to reset the XP after testing

var self = this;
var checkedKeywords = [];
var messageCopy;
var defaultMessage = "<p>Hey, how\'s it going? Just wanted to let you know that your profile is pretty awesome &ndash; very well written. Do you write in your spare time?<br /><br />Jon</p>";
var experiencePoints = parseInt(localStorage["xp"]);
var newLevel;
var currentLevel = gamify(experiencePoints); //Returns current level for comparison later


//Checks to see if we're still looking at the same girl. If so, maintains all of the data from the previous scan. 
//Uses localStorage of 'name', 'resultshtml', 'resultsimg'
function checkSameProfile(){
  var user, url, babesArray;
  console.log('checkSameProfile has been initiated');

  if (localStorage["name"]) { //Checks to see if this localstorage exists. If not, user is undefined. 
    user = localStorage["name"];  
    console.log('Found a username in local storage. It was', user);
  } else {
    console.log('No user found');
    user = null;
  }
  
  var pattern = new RegExp(user,'i'); //The username will be compared to URL, since username can be found in URL

  chrome.runtime.sendMessage({url:"getURL"},function(response){
    url = response; //Need to get the URL of the active tab from background.html via send message
    console.log(url);
    if (pattern.test(url) == true) {
      console.log("You're analyzing the same girl. Repopulating with data");
      //Hide robot face and scan button
      $('#robot').css('display', 'none');
      $('#initiate').css('display', 'none');
      
      //Display table with correct HTML
      $('#gtable > tbody').append(localStorage['resultshtml']);
      $('#picture').html(localStorage['resultsimg']);
      $('#gtable').fadeIn('slow');
      $('#thecheckbox').fadeIn('slow');
      $('#portover').fadeIn();
      $('#rescan').fadeIn();
      if (localStorage['customcheckbox'] == user) { //If I had customized the message at all, the usernames will match here, and I correctly populate table
        $('#customcheckbox').prop('checked', true);
        $('.capturemessage').html(localStorage['custommessage']);
      }

      //Add functionality back in
      babesArray = JSON.parse(localStorage['babesArray']);

      updateMessage(babesArray); //checkbox updating functionality
      updateOrder(babesArray); //Ability to move the keyword order around
      prepareDatabase(babesArray); //Ability to send to database

    } else {
      console.log('Could not find a match between the username and the URL. Starting with a clean slate.');
    }    
  });
}



//This function determines current level based on total experience points
function gamify(xp)  {
  if (xp > 0) {
    var level = determineLevelUp(xp); 
    var current = xp - level[1];
    var progress = (current/level[2])*100;
    var currentLevel = level[0];
    console.log(progress);
    
    $('#gamifybar').css('width', progress+'%');

    $('#levelnumber').text(level[0]);
    $('#pbarrequired').text(level[2]);
    $('#xpnumber').text(xp);
    $('#pbarcurrent').text(current);

    return currentLevel;

  } else {
    console.log("It seems XP is 0 or undefined:",xp);
  }
}

//Returns current level and requirement for a level-up. For example, level 2 requires 100 xp. So you'd see 0/100
function determineLevelUp(xp) {
  if (xp < 50) {
    return [1, 0,50];
  } else if (xp >= 50 && xp < 150) {
    return [2, 50, 100];
  } else if (xp >= 150 && xp < 300) {
    return [3, 150, 150];
  } else if (xp >= 300 && xp < 500) {
    return [4, 300, 200];
  } else if (xp >= 500 && xp < 750) {
    return [5, 500, 250];
  } else if (xp >= 750 && xp < 1000) {
    return [6, 750, 250];
  } else if (xp >= 1000 && xp < 1300) {
    return [7, 1000, 300];
  } else if (xp >= 1300 && xp < 1600) {
    return [8, 1300, 300];
  } else if (xp >= 1600 && xp < 2000) {
    return [9, 1600, 400];
  } else if (xp >= 2000 && xp < 2500) {
    return [10, 2000, 500];
  } else if (xp > 2500) {
    console.log("You've won the game!")
    return [99999999, 99999999];
  }
}

function levelUp() {
  $('#levelup').fadeIn('slow');
  setTimeout(function(){
    $('#levelup').fadeOut('slow');
  },6000);
}

var processKeywords = function(keywords) {     
  // Creates the checkboxes for the keywords. API sorts in order of priority, so by default, picks the first two to be pre-checked
  var keywordList = "";
  var progressBar;
  var progressBarText;
  var upArrow;
  var downArrow;
  for (var k = 0; k < keywords.matched.length; k++) {
    console.log("keywords in processKeywords function: " + keywords);

    if (k === 0 ) {
      upArrow = "";
    } else {
      upArrow = '&nbsp;<a class="moveup" data-user="' + keywords.user + '" data-keyword="' + keywords.matched[k].keyword + '" data-position="' + k + ' " href="#">&uarr;</a>';
    }

    if (k === keywords.matched.length - 1) {
      downArrow = "";
    } else {
      downArrow = '&nbsp;<a class="movedown" data-user="' + keywords.user + '" data-keyword="' + keywords.matched[k].keyword + '" data-position="' + k + ' " href="#">&darr;</a>';
    }

    if (keywords.matched[k].checked == true) {
      checkedcheck = 'checked="checked"';  // Inserts the pre-checked status to first two keywords
      checkedKeywords.push(keywords.matched[k].keyword); // Stores pre-checked keywords into an array
    } else {
      checkedcheck = '';
    }
       keywordList += '<input data-user="' + keywords.user + '" class="' + keywords.user + '" id="' + keywords.user + '-' + keywords.matched[k].keyword + '" type="checkbox" name="' + keywords.matched[k].keyword + '" value="' + keywords.matched[k].keyword + '" ' + checkedcheck + '>' + keywords.matched[k].keyword + '</input>' + upArrow + downArrow + '<br />';
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

var processMessage = function(babesArray) {
  //Processes the message to be used in the listEmOut() function
  
  var leadIn;
  var finalMessage = "";
  var fullArray = [];
  console.log("babesArray in processMessage: ", babesArray);    
  console.log("checkedKeywords array: ", checkedKeywords);
  for (var k = 0; k < babesArray.matched.length; k++) {
    if ($.inArray(babesArray.matched[k].keyword, checkedKeywords) > -1) {
      fullArray.push(babesArray.matched[k].message);
    }
  }

  for (var l = 0; l < fullArray.length; l++) {
    if (l === 0) {leadIn = babesArray.opener.replace(/\n/gi,"<br />");} else if (l===1){leadIn = babesArray.first_transition;} else {leadIn = babesArray.second_transition;}
    console.log("leadIn:", leadIn);
    finalMessage += "<p>" + leadIn + fullArray[l] + "</p>";
  }

  checkedKeywords = []; //resets checkedKeywords for the next iteration
  finalMessage += '<p>'+ babesArray.closer.replace(/\n/gi,"<br />"); + '</p>'
  //console.log("Closer:",babesArray.closer.replace(/\n/gi,"<br />"));
  //console.log("Final message:",finalMessage);
  return(finalMessage);
};

var listEmOut = function(babesArr){           
  //generate the table entry using all of the functions above
  //Will probably want to break this into more digestible functions at some point
  var babeOutput = "";
  var babeImage = "";

  babeOutput += '<tr class="' + babesArr.user +'">';
  babeOutput += '</td><td class="keywords"> <form name="keywordform"> ' + processKeywords(babesArr) + ' </form> </td>';
  babeOutput += '<td class="context"> <ul> ' + processContext(babesArr) + ' </ul> </td><td class="message" id="' + babesArr.user + '"><div class="capturemessage" id="' + babesArr.user + 'message"> ' + processMessage(babesArr) + '</div><button class="btn edit">Edit</button><textarea class="changetext" wrap="hard"></textarea><button class="btn save">Save</button></td>';
  babeOutput += '</tr>'
  
  babeImage = '<img width="100px" src="' + babesArr.pic + '"><br />';
  $('#gtable > tbody').append(babeOutput);
  $('#picture').html(babeImage);
  
  localStorage['resultshtml'] = babeOutput;
  localStorage['resultsimg'] = babeImage;

};

//Create message-updating functionality
function updateMessage(babesArr) {
      $('input').click(function(event){  //Captures all of the checked boxes that match the class of the box checked or unchecked
        if ($(this).val() != "messaged" && $(this).val() != "custom") {

          var messages = babesArr.matched;
          var clickedName = $(event.target).attr('class');
          var valuesArr = $('input:checkbox:checked.' + clickedName).map(function () { 
            return this.value;
            }).get();
          var matched;

          console.log('Values that are captured as checked:', valuesArr);

          //Nested for loops determine which keywords in the babesArray match the array containing checked keywords. 
          for (var i = 0; i < messages.length; i++) {
            console.log('Messages for loop initiated');
            matched = false; //Resets the match indicator for each keywords cycled through

            for (var k = 0; k < valuesArr.length; k++) {
              console.log('Comparing ' + messages[i].keyword + ' to ' + valuesArr[k]);
              if (messages[i].keyword == valuesArr[k]) {
                console.log('We found a match between checked keyword and babeObj!', valuesArr[k]);
                matched = true;
              }
            }
            messages[i].checked = matched; //Sets the value in the babesArray
          }
          $('#customcheckbox').prop('checked', false); //Since checking a keyword uses defaults, we uncheck the customized button, in case it was marked
          localStorage['customcheckbox'] = false; //Removes the user name from localStorage, since using defaults, as mentioned above

          $("tbody").empty();
          listEmOut(babesArr);
          //setEventListeners(babesArray);
          updateMessage(babesArr);
          updateOrder(babesArr);
          prepareDatabase(babesArr); //Sets up event handlers and messages to background.js that fire when you submit data to the database
          
          localStorage['babesArray'] = JSON.stringify(babesArr); //Saves the update back to local storage

        }
    }); 

    //This is where we can manually edit the message. Taken from: http://www.tonylea.com/2010/jquery-easy-editable-text-fields/      
    $('.edit').click(function(){
      var editableText = processLineBreaks($(this).prev().html());
      $(this).next().val(editableText);
      $(this).hide();
      $(this).prev().hide();
      $(this).next().show();
      $(this).next().next().show();
      $(this).next().select();

      $('.changetext').blur(function() { //When you click Save, or navigate from the text box, restore normal display
        console.log("Your text box just lost focus!");
        if ($.trim(this.value) == ''){
          this.value = (this.defaultValue ? this.defaultValue : ''); //If textarea is made blank, do nothing and restore default value
        } else {
          var htmlText = reverseLineBreaks(this.value)
          $('#customcheckbox').prop('checked', true);
          localStorage['customcheckbox'] = babesArr.user; //Will be used to restoring the scrape properly upon opening extension again
          localStorage['custommessage'] = htmlText;

          $(this).prev().prev().html(htmlText);
        }
     
         $(this).hide(); //Hide textarea
         $(this).prev().show(); //Show edit button
         $(this).prev().prev().show(); //Show HTML message
         $(this).next().hide(); //Hide save button
      });
    });
}


function updateOrder(babesArr) {
  $(document.body).on('click','.moveup',function(){
    console.log("Here's the babesArr coming into the updateOrder function: ", babesArr);

    var user = $(this).data("user");
    var thisKeyword = $(this).data("keyword");
    var thisPosition = parseInt($(this).data("position"));
    var preKeyword = $(this).prev().prev().prev().data("keyword");

    var thisObject = babesArr.matched[thisPosition];
    var prevObject = babesArr.matched[thisPosition-1];

    console.log("thisObject: ", thisObject);
    console.log("prevObject: ", prevObject);

    babesArr.matched[thisPosition] = prevObject;
    babesArr.matched[thisPosition-1] = thisObject;

    console.log("Here's the babesArr leaving the updateOrder function: ", babesArr);
    $("tbody").empty();
    listEmOut(babesArr);
    updateMessage(babesArr); //This reactivates the onclick handlers for updating message
    localStorage['babesArray'] = JSON.stringify(babesArr);
  });

  $(document.body).on('click','.movedown',function(){
    console.log("Here's the babesArr coming into the updateOrder function: ", babesArr);

    var user = $(this).data("user");
    var thisKeyword = $(this).data("keyword");
    var thisPosition = parseInt($(this).data("position"));
    var nextKeyword = $(this).next().next().next().data("keyword");

    var thisObject = babesArr.matched[thisPosition];
    var nextObject = babesArr.matched[thisPosition+1];

    console.log("thisObject: ", thisObject);
    console.log("nextObject: ", nextObject);

    babesArr.matched[thisPosition] = nextObject;
    babesArr.matched[thisPosition+1] = thisObject;

    console.log("Here's the babesArr leaving the updateOrder function: ", babesArr);
    $("tbody").empty();
    listEmOut(babesArr);
    updateMessage(babesArr); //This reactivates the onclick handlers for updating message
    localStorage['babesArray'] = JSON.stringify(babesArr);
  });
}

function prepareDatabase(babesArray) {
  $('#messagedcheckbox').click(function(){
    console.log('Messaged checkbox has been clicked');
    if($(this).is(':checked')) {
      console.log('Yup, it\'s checked!');
      $('#senddatabase').fadeIn();
    } else {
      $('#senddatabase').fadeOut();
    }  
  });

  $('#senddatabase').click(function() {
      var babeObj = {};
      var keywordObj = {};
      var d = new Date;
      var curr_date = d.getDate();
      var curr_month = d.getMonth() + 1; //Months are zero based
      var curr_year = d.getFullYear();
      var dateFormatted = curr_year + "-" + curr_month + "-" + curr_date;

      if ($('#customcheckbox').is(':checked')) {
        var custom = true;
      } else {
        var custom = false;
      }

      var keywords = $('.keywords input:checkbox:checked').map(function () { 
        return this.value;
      }).get();
      console.log("Keywords you messaged her with: ", keywords);

      for (var i = 0; i < keywords.length; i++) {
        keywordObj[keywords[i]] = i+1;
        console.log("Adding", keywords[i], "to the object, marked as order number", i+1);
      }
    
    try {
      babeObj.keywords = keywordObj;
      babeObj.username = babesArray.user;
      babeObj.date_messaged = dateFormatted;
      babeObj.customized = custom;
      babeObj.opener = babesArray.opener;
      babeObj.closer = babesArray.closer;

      //Now, sending the babeObj to the background js file to push to the server
      chrome.runtime.sendMessage({database:babeObj},function(response){
        console.log("Successfully sent the babeObj!", response);
        $('#senddatabase').fadeOut();
        $('#confirmation').html("<br /><p><strong>Success! +25 XP for you!</strong></p><p>FYI, here's what we sent over:</p><p>" + JSON.stringify(babeObj, null, " ") + "</p>");
        if (testEnvironment == false) {
          experiencePoints += 25;                  
        }

        localStorage["xp"] = experiencePoints;
        newLevel = gamify(experiencePoints);

        if (newLevel > currentLevel) {
          console.log("LEVEL UP!");
          levelUp();
          currentLevel = newLevel; //This is so if you level up during scan, you don't get another level up message from subsequent message send
        }
      });

    } 
    catch(e) {
      console.log("Error in creating the babeObj:", e);
    }
  });          
}

function processLineBreaks(text) {
  var final;
  final = text.replace(/\s*<br><br>\s*/gi,"\n\n");
  final = final.replace(/\s*<br \/><br \/>\s*/gi,"\n\n");
  final = final.replace(/\s*<\/p>\s?<p>\s*/gi,"\n\n");
  final = final.replace(/\s*<p>\s*/gi,"");
  final = final.replace(/\s*<\/p>\s*/gi,"");
  final = final.replace(/\s*<br>\s*/gi,"\n");
  return final;
}

function reverseLineBreaks(text) {
  var final;
  final = text.replace(/\n/gi, "<br />");
  return final
}


//***********************************Begin code***********************************//
//

checkSameProfile(); //First thing to be checked. If this girl was JUST scanned, can pull that data back up without needing a rescan
var rescan = 0; //An incrementor that will prevent the rescan from adding additional event listeners

$('#portover').click(function(){
  var raw = $('.capturemessage').html();
  var messageToPort = processLineBreaks(raw);
  chrome.runtime.sendMessage({portover:messageToPort},function(response){});
});

$('#rescan').click(function(){ //This will clear the table, grab the data from the page again, and generate a new set of results. Most commonly used when you add a new keyword and want to update the view
  localStorage["name"] = null;
  $("tbody").empty();
  $("#picture").empty();
  $('#the-progress-bar').css('display', 'none');
  chrome.runtime.sendMessage({method:"triggerScript"},function(response){});
  if (rescan == 0) {
    chrome.runtime.onMessage.addListener(function (msg, sender, sendResponse) {
      generateResultsView(msg, sender, sendResponse);
    }); 
  }
  rescan++; //Increments rescan so if you click 'rescan' again during same session, won't add a duplicate generateResultsView event listener
});


//jQuery event handling for clicking on the "Scan Page" button when on an OKC profile
$("#initiate").click(function() {
  console.log("Button has been initated.")

  //First, we send a runtime message to the background script. Then, we add a listener for the result back the content and background scripts. 
  chrome.runtime.sendMessage({method:"triggerScript"},function(response){});
  chrome.runtime.onMessage.addListener(function (msg, sender, sendResponse) {
    generateResultsView(msg, sender, sendResponse);
  });  
});

function generateResultsView(msg, sender, sendResponse){
  if (msg.finalresult == "ready") {
      console.log("Asynchronous call was successful!");
      
      if ($('#picture').html().length > 0) {
        console.log("Has already run!");
      } else {
        //Sends a message to the background.js file with the method "getProfile". Upon receiving response, updates DOM of popup.html
        chrome.runtime.sendMessage({method:"getProfile"},function(response){
        
          if (!response) {
            $('#info').html('<span style="color:red;">Can\'t find any profiles on this page. Are you on an OKCupid profile right now? If so, refreshing the page should fix this error</span>');
          } else {
            $('#robot').slideUp();
            $('#initiate').fadeOut();
            $('#portover').fadeIn();
            $('#rescan').fadeIn();
            response = response.replace(/\n/gi,"\\n");
            console.log("response: ", response);
            console.log("babesArray: ", babesArray);
            var babesArray = JSON.parse(response);
          }

          if (babesArray.matched.length != 0) {
            localStorage['babesArray'] = JSON.stringify(babesArray);
            $('#gtable').slideDown('slow');
            $('#thecheckbox').fadeIn('slow');
            
            //Adds 5 points to XP bar for each match you find. 
            var userLastScanned = localStorage["name"]; //Will be used to make sure we don't get additional points for rescans of the same girl. Also, will be used for possibly keeping the table active if you're on the same page
            console.log("The name of the girl just scanned is", userLastScanned);
            
            if (babesArray.user == userLastScanned) {
              console.log("No XP for you. She was just scanned before.");
            } else {
              if (testEnvironment == false) {
                experiencePoints += 5;
              }
              localStorage["xp"] = experiencePoints;
              newLevel = gamify(experiencePoints);
              
              if (newLevel > currentLevel) {
                console.log("LEVEL UP!");
                levelUp();
                currentLevel = newLevel; //This is so if you level up during scan, you don't get another level up message from subsequent message send
              }
            }
            
            localStorage["name"] = babesArray.user; //This will be used to make sure you don't get more XP for a duplicate scan of same girl

          } else {
            $('#info').html('<p style="color:DarkRed;">Looks like this girl has nothing in common with you based on your keywords. Bummer. Try this default message on for size:</p><div style="border-style:dotted; padding:5px;">' + defaultMessage + '</div>');
          }
          
          $('#the-progress-bar').css('display', 'block');

          listEmOut(babesArray);
          //setEventListeners(babesArray);
          updateMessage(babesArray);
          updateOrder(babesArray);
          prepareDatabase(babesArray); //Sets up event handlers and messages to background.js that fire when you submit data to the database
          
        }); //Ends chrome sendmessage response code
      } //Ends the else statement for the image check
    } //End the if statement for msg.finalresult
}


