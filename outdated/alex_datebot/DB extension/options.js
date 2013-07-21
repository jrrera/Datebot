// Saves options to localStorage.
function save_options(jsonobject) {
  var preferences = jsonobject;
  
  localStorage["keywords"] = preferences;
  $('#status').html('<span style="color:green;">Keywords and messages saved!</span>');
  setTimeout(function() {
    $('#status').text("");
  }, 5000);

  chrome.runtime.sendMessage({update: true});

}

// Restores select box state to saved value from localStorage.
function restore_options() {
  //Will pull the JSON file and populate the inputs 
  var profile = localStorage["keywords"];
  //For testing: var profile = '{"pairs": [{"keyword":"jewish", "message":"I\'m Jewish too. Did you grow up in a religious household? I grew up in a super kosher household, so my first cheeseburger was an act of rebellion when I was in high school haha."},{"keyword":"israel", "message":"How did you like Israel, by the way? I\'ve been twice, and I\'ve loved every experience I had there."},{"keyword":"thai", "message":"I LOVE Thai food. I\'d go crazy if I went for more than a few weeks without pad thai haha. What\'s your favorite dish?"},{"keyword":"edm", "message":"I\'m really into EDM music too. Which genres do you like? I\'m mostly into house, electro, and dubstep."},{"keyword":"skrillex", "message":"I noticed you listen to Skrillex – that\'s how I got into dubstep haha. Do you listen to any other dubstep artists?"},{"keyword":"trance", "message":"I\'m really into trance music too. Any favorite DJs? Gareth Emery is my all-time favorite."},{"keyword":"dubstep", "message":"I\'m pretty into dubstep too. Any favorite artists?"},{"keyword":"seven lions", "message":"I am obsessed with Seven Lions. Have you seen him live? He\'s incredible."},{"keyword":"blog", "message":"It\'s awesome that you have a blog. I\'ve been blogging for a while now too. What do you like to write about?"},{"keyword":"blogging", "message":"It\'s awesome that you blog. I\'ve been blogging for a while now too. What do you like to write about?"},{"keyword":"new york", "message":"Im from New York as well. Where did you live when you were there, and how did you like it?"}]} ';
  console.log(profile);
  var profileObj = JSON.parse(profile);
  
  if (!profile) {
    console.log("Could not locate preferences in local storage :(.");
    add_row();
    add_row();
    add_row();
  } else {
    add_prepopulated_rows(profileObj);

    if (profileObj.opener.length > 0) {
      $('#opener').text(profileObj.opener);
    }

    if (profileObj.closer.length > 0) {
      $('#closer').text(profileObj.closer);
    }
  }

  console.log(profileObj);
}

function add_row() {
  var newRow = '<div class="subs"><div class="key_div"><input class="sub_key" type="text" placeholder="Enter a new interest keyword" value="">' +         
            '</div><div class="value_div"><textarea rows="2" cols="30" class="expand50-1000" placeholder="What would you usually write for this mutual interest?"></textarea></div><div class="del_button">' +
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

  console.log("prepopRow: ",prepopRow);

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


function createObject(keywords,messages, msgOpen, msgClose) {
  for (var i = 0; i < keywords.length; i++) {
    if (keywords[i] == "" || messages[i] == "") {
      console.log("Let's splice and trim this mother fucker");
      keywords.splice(i);
      messages.splice(i);

    } 
  }
  var keywordObject = '{"opener":"' + msgOpen + '",';
  keywordObject += '"closer":"' + msgClose + '",';
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

//This is where the code starts (Everything above are functions)
document.addEventListener('DOMContentLoaded', restore_options);
$(document).ready(function(){
  $("#add").click(function(){
    add_row();
  }); //Add a row

  $(document.body).on('click','.delete',function(){
    $(this).parent().parent().fadeOut('slow', function() { 
      $(this).remove(); 
    });
  }); //Delete an entry

  $(document.body).on('click','#save',function(){
    var keywords = [];
    var messages = [];
    var msgOpen = "";
    var msgClose = "";
    $('.sub_key').each(function(){
        keywords.push($(this).val());
    });
    $('.expand50-1000').each(function(){
        messages.push($(this).val());
    });
    msgOpen = $('#opener').val();
    msgClose = $('#closer').val();

    if (qualityCheck(keywords,messages) == true){
      console.log("All looks good here!");
      //Now, strip the trailing blank values, and continue by transforming into an object
      save_options(createObject(keywords,messages, msgOpen, msgClose));


    } else {
      $('#status').html('<span style="color:red;">' + qualityCheck(keywords,messages) + '</span>');
    }
  }); // Save settings

  $(document.body).on('click','#export',function(){
    var keywords = [];
    var messages = [];
    var msgOpen = "";
    var msgClose = "";
    $('.sub_key').each(function(){
        keywords.push($(this).val());
    });
    $('.expand50-1000').each(function(){
        messages.push($(this).val());
    });
    msgOpen = $('#opener').val();
    msgClose = $('#closer').val();

    if (qualityCheck(keywords,messages) == true){
      console.log("All looks good here!");
      //Now, strip the trailing blank values, and continue by transforming into an object
      save_options(createObject(keywords,messages, msgOpen, msgClose));
      var alertExport = localStorage["keywords"];   
      alert("Once you click OK on this dialog, you'll see your backup data. Click on the data, press CTRL+A to select it all, then CTRL+C to copy it. Then press ENTER.");   
      alert(alertExport);

    } else {
      $('#status').html('<span style="color:red;">' + qualityCheck(keywords,messages) + '</span>');
    }
  }); // Save and export settings  
});