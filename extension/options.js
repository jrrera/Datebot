//If you ever need to restore keyword data into localStorage, follow these steps:
/*
1) create a variable called jsonRestore that you paste in the object from CouchDB. Then search that whole string and replace all apostraphes with an escaped apostraphe so you can wrap it in apostraphes to define it as a string

2)var jsonFix = jsonRestore.replace(/\\'/gi,"'"); //This will replace the escaped apostrpahes back into regular ones, so that JSON becomes valid again

3) remove any \n line breaks in opener or keywords. These will also break the JSON

4) localStorage["keywords"] = jsonFix;

5) PHEW! ALl done.
*/

var testEnvironment = false; 
var testStorage = "keywordsTestingArea";

// Saves options to localStorage.
function save_options(jsonobject) {
  var preferences = jsonobject;
  try {
    JSON.parse(preferences);

  if (testEnvironment === false) {
    localStorage["keywords"] = preferences;

    chrome.runtime.sendMessage({databaseKeywords:preferences},function(response){
      console.log("Successfully sent the keywords and messages!", response);
    });


    $('#status').html('<span style="color:green;">Keywords and messages saved locally and sent to database!</span>');
    setTimeout(function() {
      $('#status').text("");
    }, 5000);   
  } else {
    localStorage["keywordsTestEnvironment"] = preferences;
    $('#status').html('<span style="color:green;">Keywords and messages saved in the test environment!</span>');
    setTimeout(function() {
      $('#status').text("");
    }, 5000); 
  }

  }
  catch(e) {
    console.log("There was an error trying to parse the options you are trying to save: ", e);
  }
  //This will determine where the options are saved. Test enviroment saves to a different part of local storage. 

  chrome.runtime.sendMessage({update: true});

}

// Restores select box state to saved value from localStorage.
function restore_options() {
  //Will pull the JSON file and populate the inputs 
  if (testEnvironment === false) {
        var profile = localStorage["keywords"];    
  } else if (testEnvironment === true) {
        var profile = localStorage[testStorage];    
  } 
  
  if (!profile || profile.length === 0) {
    console.log("Could not locate preferences in local storage :(.");
    
    prebuiltKeywords("new");

  } else {

    try {
        //Parse the string into JSON and populate the page

        var profileObj = JSON.parse(profile);
        add_prepopulated_rows(profileObj);
        console.log(profileObj);

        if (profileObj.opener.length > 0) {
          $('#opener').text(profileObj.opener);
        }

        if (profileObj.closer.length > 0) {
          $('#closer').text(profileObj.closer);
        }

        if (profileObj.first_transition.length > 0) {
          $('#transition1').text(profileObj.first_transition);
        }

        if (profileObj.second_transition.length > 0) {
          $('#transition2').text(profileObj.second_transition);
        }     
    }
    catch (e) {
        console.log(e);
        console.log("Warning! Caught an error when trying to parse localStorage keywords. Adding default rows instead. Take console log below and try and fix the corrupted data");
        console.log(profile);

        prebuiltKeywords("error");

    }
 
  }
}

function import_keywords(keywords) {
  //Receive the JSON from App Engine (passed in from background page, and process if testing mode is off)
  if (testEnvironment === false) {
    try {
        var profileObj = JSON.parse(keywords);    
        //Clear page of current keywords
        $('#keywords').empty();

        //Populate the page
        add_prepopulated_rows(profileObj);
        console.log(profileObj);

        if (profileObj.opener.length > 0) {
          $('#opener').text(profileObj.opener);
        }

        if (profileObj.closer.length > 0) {
          $('#closer').text(profileObj.closer);
        }

        if (profileObj.first_transition.length > 0) {
          $('#transition1').text(profileObj.first_transition);
        }

        if (profileObj.second_transition.length > 0) {
          $('#transition2').text(profileObj.second_transition);
        }     
    }
    catch (e) {
        console.log(e);
        console.log("Warning! Caught an error when trying to parse AppEngine keywords. Adding default rows instead. Take console log below and try and fix the corrupted data");
        console.log(profileObj);
        prebuiltKeywords("error");
    }
  } else {
    alert("Keywords not imported because testing environment is on!");
  }
}



function prebuiltKeywords(status) {

    if (status == "new") {
        $('#status').html('<span style="color:blue;">Welcome to Datebot! To get you started, below are a few suggestions for getting started with Datebot\'s interest matching features. Enjoy!</span>');
    }
    if (status == "error") {
        $('#status').html('<span style="color:red;">It looks like we\'re having problems finding your keywords. Please see the console log for details. If you\'re new, ignore this message, and please enjoy some suggested keywords.</span>');
    }
    add_suggested_row("cooking","I'm really into cooking too. Do you have a specialty dish? Mine's {{INSERT DISH NAME HERE}}." );
    add_suggested_row("travel","How was traveling in {{COUNTRY/STATE/PLACE}}? I've been to {{COUNTRY/STATE/PLACE}} and had an amazing time.");
    add_suggested_row("foodie", "I'm a total foodie too. Have you ever been to {{PLACE}} in {{NEIGHBORHOOD}}? It's unbelievable.");
    add_suggested_row("thai", "Thai food is my absolutely favorite right now. Have you been to {{PLACE}} in {{NEIGHBORHOOD}}? It's fantastic.");
    add_suggested_row("barhopping", "Since moving here, I've been loving the bar scene. What's your favorite bar? I'm pretty fond of {{BAR}}.");
    add_suggested_row("game of thrones", "I definitely share your love for Game of Thrones. Who's your favorite character? I'd have to give it to Jon Snow on that one.");

}

function add_row() {
  var newRow = '<div class="subs"><div class="key_div"><input class="sub_key" type="text" placeholder="Enter a new interest keyword" value="">' +         
            '</div><div class="value_div"><textarea rows="2" cols="30" class="expand50-1000" placeholder="What would you usually write for this mutual interest?"></textarea></div><div class="del_button">' +
            '<button class="delete" name="delete">Delete</button></div></div>';
  $('#keywords').append(newRow);
}

function add_suggested_row(keyword, text) {
  var newRow = '<div class="subs"><div class="key_div"><input class="sub_key" type="text" placeholder="Enter a new interest keyword" value="' + keyword + '">' +         
            '</div><div class="value_div"><textarea rows="2" cols="30" class="expand50-1000" placeholder="What would you usually write for this mutual interest?">' + text + '</textarea></div><div class="del_button">' +
            '<button class="delete" name="delete">Delete</button></div></div>';
  $('#keywords').append(newRow);
}

function add_prepopulated_rows(keyvalues) {
  var pairs = keyvalues.pairs;
  var prepopRow = "";

  for (var i = 0; i < pairs.length; i++) {
    prepopRow += '<div class="subs"><div class="key_div"><input class="sub_key" type="text" placeholder="Enter a new interest keyword" value="'+ pairs[i].keyword +'">';         
    prepopRow += '</div><div class="value_div"><textarea rows="2" cols="30" class="expand50-1000" placeholder="What would you usually write for this mutual interest?">' + pairs[i].message + '</textarea></div><div class="del_button">';
    prepopRow += '<button class="delete" name="delete">Delete</button></div></div>';
  }

  $('#keywords').append(prepopRow);
}

function qualityCheck (keywords, messages) {
  //Here begin checks to make sure fields were filled out correctly, converts to all lowercase
  var securityEval = true;

  if ($.inArray("", keywords) != -1) {
    var indexNo = $.inArray("", keywords);
    if (messages[indexNo] != "") {
      console.log(indexNo);
      console.log("Warning, one or more of your keyword fields is blank. Please fix and try saving again.")
      securityEval = "Warning, one or more of your keyword fields is blank. Please fix and try saving again.";
    }
  }

  if ($.inArray("", messages) != -1) {
    var indexNo2 = $.inArray("", messages);
    if (keywords[indexNo2] != "") {
      console.log(indexNo2);
      console.log("Warning, one or more of your message fields is blank. Please fix and try saving again.")
      securityEval = "Warning, one or more of your message fields is blank. Please fix and try saving again."; 
    }
  }

  console.log("securityEval: ", securityEval)
  return securityEval;
}


function createObject(keywords,messages, msgOpen, msgClose, firstTransition, secondTransition) {
  for (var i = 0; i < keywords.length; i++) {
    if (keywords[i] == "" || messages[i] == "") {
      //If any extra rows, remove them from the array
      keywords.splice(i);
      messages.splice(i);

    } 

    //If opener or closer have line breaks, this should prevent JSON errors
    var lineBreakRemover = new RegExp('\n','i');
    msgOpen = msgOpen.replace(lineBreakRemover, '\\n');
    msgClose = msgClose.replace(lineBreakRemover, '\\n');
    firstTransition = firstTransition.replace(lineBreakRemover, '\\n');
    secondTransition = secondTransition.replace(lineBreakRemover, '\\n');


  }
  var keywordObject = '{"opener":"' + msgOpen + '",';
  keywordObject += '"closer":"' + msgClose + '",';
  keywordObject += '"first_transition":"' + firstTransition + '",';
  keywordObject += '"second_transition":"' + secondTransition + '",';  
  keywordObject += '"pairs": [';
  for (var i = 0; i<keywords.length; i++) {
    keywordObject += '{"keyword":"' + $.trim(keywords[i].toLowerCase()) + '", "message":"' + $.trim(messages[i]) + '"';
    if (i != keywords.length - 1) {
      keywordObject += "},";
    }
  }
  keywordObject += "}]}";
  console.log("keywordObject: ", keywordObject); 
  return keywordObject;
}




//Adds event listener for Context Menu to grab any new keywords
/*chrome.contextMenus.onClicked.addListener(function(info,tab) {
  console.log("contextMenus listener was triggered");
  var newKeyword = info.selectionText;
  if (newKeyword.length > 0) {
    add_suggested_row(newKeyword,"{{Not populated with data yet}}");
    console.log("New keyword should've just been added! Now we need to add some saving functionality :P"); 
  }

});
*/

//This function redundant, but this code is stored on the click for save, so repeated as dedicated function here. 
function saveFromContextMenu() {
    var keywords = [];
    var messages = [];
    var msgOpen = "";
    var msgClose = "";
    var firstTransition = "";
    var secondTransition = "";
    $('.sub_key').each(function(){
        keywords.push($(this).val());
    });
    $('.expand50-1000').each(function(){
        messages.push($(this).val());
    });
    msgOpen = $('#opener').val();
    msgClose = $('#closer').val();
    firstTransition = $('#transition1').val();
    secondTransition = $('#transition2').val();
    console.log("firstTransition: ", firstTransition);

    if (qualityCheck(keywords,messages) == true){
      console.log("All looks good here!");
      //Now, strip the trailing blank values, and continue by transforming into an object
      save_options(createObject(keywords,messages, msgOpen, msgClose, firstTransition, secondTransition));
    } else {
      $('#status').html('<span style="color:red;">' + qualityCheck(keywords,messages) + '</span>');
    }// Save settings
}

//Used for trimming the space off of newly added keywords.
function trimKeyword (str) {
    return str.replace(/^\s\s*/, '').replace(/\s\s*$/, '');
}

//When using the contextmenu, will check to see that the keyword doesn't already exist.
function checkForExistingKeywords(keyword) {
  var existingKeywords = [],
  pattern = new RegExp("^" + keyword + "$", "i"),
  match = false;
  $('.sub_key').each(function(){
        existingKeywords.push($(this).val());
  });

  for (var i = 0; i < existingKeywords.length; i++) {
    if (pattern.test(existingKeywords[i]) === true) {
      match = true;
      console.log("We found a match! It was: ", existingKeywords[i]);
      return match;
    }
  }
  console.log("No match was found in currently existing keyword set. Should be good to go to save this new keyword.");
  return match;
}


chrome.runtime.onMessage.addListener(function (msg, sender, sendResponse) {
  if (msg.newKeyword) {
    console.log("contextMenus listener was triggered");
    var newKeyword = trimKeyword(msg.newKeyword);
    if (newKeyword.length > 0) {
      if (checkForExistingKeywords(newKeyword) === false){
        add_suggested_row(newKeyword,"{{Not populated with data yet}}");
        saveFromContextMenu();
      }
    }
  }
});

//Calculates progress for progress bar
function calculateProgress() {
  var goal = 100,
  keywords = [],
  current,
  result;
  
  $('.sub_key').each(function(){
        keywords.push($(this).val());
    });
  current = keywords.length;
  console.log("Current number of keywords is: ", current);

  result = (current/goal)*100;
  console.log("Result: ", result);

  $("#progressbar div").css("width",result+"%").text(result+"%");
  $("#progressreport").html("<p>You've created " + current + " keywords! The goal is <strong>" + goal + "</strong> keywords, so you're <strong>" + result + "</strong>% of the way there!</p>");
}



//This is where the code starts (Everything above are functions)
document.addEventListener('DOMContentLoaded', restore_options);
document.addEventListener('DOMContentLoaded', calculateProgress);

$(document).ready(function(){
  $(".add").click(function(){
    add_row();
  }); //Add a row

  $(document.body).on('click','.delete',function(){
    $(this).parent().parent().fadeOut('slow', function() { 
      $(this).remove(); 
    });
  }); //Delete an entry

  $(document.body).on('click','.save',function(){
    var keywords = [];
    var messages = [];
    var msgOpen = "";
    var msgClose = "";
    var firstTransition = "";
    var secondTransition = "";
    $('.sub_key').each(function(){
        keywords.push($(this).val());
    });
    $('.expand50-1000').each(function(){
        messages.push($(this).val());
    });
    msgOpen = $('#opener').val();
    msgClose = $('#closer').val();
    firstTransition = $('#transition1').val();
    secondTransition = $('#transition2').val();
    console.log("firstTransition: ", firstTransition);

    if (qualityCheck(keywords,messages) == true){
      console.log("All looks good here!");
      //Now, strip the trailing blank values, and continue by transforming into an object
      save_options(createObject(keywords,messages, msgOpen, msgClose, firstTransition, secondTransition));


    } else {
      $('#status').html('<span style="color:red;">' + qualityCheck(keywords,messages) + '</span>');
    }
  }); // Save settings

  $(document.body).on('click','#export',function(){
    var keywords = [];
    var messages = [];
    var msgOpen = "";
    var msgClose = "";
    var firstTransition = "";
    var secondTransition = "";

    $('.sub_key').each(function(){
        keywords.push($(this).val());
    });
    $('.expand50-1000').each(function(){
        messages.push($(this).val());
    });
    msgOpen = $('#opener').val();
    msgClose = $('#closer').val();
    firstTransition = $('#transition1').val();
    secondTransition = $('#transition2').val();

    if (qualityCheck(keywords,messages) == true){
      console.log("All looks good here!");
      //Now, strip the trailing blank values, and continue by transforming into an object
      save_options(createObject(keywords,messages, msgOpen, msgClose, firstTransition, secondTransition));
      var alertExport = localStorage["keywords"];   
      alert("Once you click OK on this dialog, you'll see your backup data. Click on the data, press CTRL+A to select it all, then CTRL+C to copy it. Then press ENTER. If you're in a test environment, you'll still see the live, non-dev data for now.");   
      alert(alertExport);

    } else {
      $('#status').html('<span style="color:red;">' + qualityCheck(keywords,messages) + '</span>');
    }
  }); // Save and export settings  
  

  $(document.body).on('click','#import',function(){
    chrome.runtime.sendMessage({"request":"appengine_keywords"},function(response){
      console.log("Here's the data you requested:", response);
      import_keywords(response);
    });
  });

  $('#requestdata').click(function(){
    console.log("Request for data has initiated.");
    chrome.runtime.sendMessage({requestAllData:"begin"},function(response){
      console.log("Here's the data you requested:", response);
    });
  });
});