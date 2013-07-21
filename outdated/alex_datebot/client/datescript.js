/* Uncomment once this goes live. Password protection.

var password; 
    var thePassword="codetogetlaid"; 
    password=prompt('Enter Password',''); 
    if (password == thePassword) {
	 	$('#protection').hide();
		} else { 
			alert("Sorry, wrong password!");
			window.location="http://www.google.com/"; 
		}
//Additional feature -- if no click activity in over 4 minutes, password lock. use some timer code
*/

(function($){ 	//Sets the document as jQuery
    var self = this;
	var checkedKeywords = [];

	var processKeywords = function(keywords) {     
		// Creates the checkboxes for the keywords. API sorts in order of priority, so by default, picks the first two to be pre-checked
		var keywordList = "";
		for (var k = 0; k < keywords.matched.length; k++) {
			if (k === 0 || k === 1) {
				checkedcheck = 'checked="checked"';  // Inserts the pre-checked status to first two keywords
				checkedKeywords.push(keywords.matched[k].keyword); // Stores pre-checked keywords into an array
			} else {
				checkedcheck = '';
			}
				 keywordList += '<input data-user="' + keywords.user + '" class="' + keywords.user + '" id="' + keywords.user + '-' + keywords.matched[k].keyword + '" type="checkbox" name="' + keywords.matched[k].keyword + '" value="' + keywords.matched[k].keyword + '" ' + checkedcheck + '>' + keywords.matched[k].keyword + '</input><br />';
		}
		return(keywordList);
	};
	
	var processContext = function(keywords) {
		//Processes the context around each keyword to be used in the listEmOut() function
		//Alex recommended using RegEx to identify keyword and wrap it in a span tag that styles it in blue
		var keywordContextList = "";
		var keywordSpanTagContainer = [];

		for (var i = 0; i < keywords.matched.length; i++) {
			keywordSpanTagContainer.push('<span class="bluekeywords">' + keywords.matched[i].keyword + '</span>');
		} //Wraps keywords in the span tag

		for (var k = 0; k < keywords.matched.length; k++) {
			keywordContextList += "<li>" + keywords.matched[k].context + "</li><br />";
		} //Creates the <li> context list

		for (k = 0; k < keywordSpanTagContainer.length; k++) {
			keywordContextList = keywordContextList.replace(keywords.matched[k].keyword, keywordSpanTagContainer[k]);
		} //Does a find and replace for the keywords and replaces in blue. Currently case sensitive. 

		return(keywordContextList);
	};
	
	var processMessage = function(keywordmessage) {
		//Processes the message to be used in the listEmOut() function
		var leadIn;
		var finalMessage = "";
		var fullArray = [];
		
		for (var k = 0; k < keywordmessage.matched.length; k++) {
			if (keywordmessage.matched[k].keyword == checkedKeywords[k]){
				fullArray.push(keywordmessage.matched[k].message);
			}
				
		}
		for (var l = 0; l < fullArray.length; l++) {
			if (l === 0) {leadIn = "Heya, how's it going? ";} else if (l===1){leadIn = "Also, ";} else {"Oh, and ";}
			finalMessage += leadIn + fullArray[l] + '<br /><br />';
		}
		checkedKeywords = []; //resets checkedKeywords for the next iteration
		return(finalMessage);
	};
	
	var listEmOut = function(babesArr){           
		//generate the table entry using all of the functions above
		//Will probably want to break this into more digestible functions at some point
		var babeOutput = "";
		for (var i = 0; i < babesArr.length; i++) {
			babeOutput += '<tr class="' + babesArr[i].user +'">';
			babeOutput += '<td class="pic">' + '<a href="' + babesArr[i].url + '"><img width="100px" src="' + babesArr[i].pic + '"></a> <br /> <p class="belowimage">Age: ' + babesArr[i].age + '</p> <p class="belowimage">City: ' + babesArr[i].location + '</p>';
			babeOutput += '</td><td class="keywords"> <form name="keywordform"> ' + processKeywords(babesArr[i]) + ' </form> </td>';
			babeOutput += '<td class="context"> <ul> ' + processContext(babesArr[i]) + ' </ul> </td><td class="message" id="' + babesArr[i].user + '"><div id="' + babesArr[i].user + 'message"><p>' + processMessage(babesArr[i]) + 'Jon</p></div><button class="edit">Edit</button><textarea wrap="hard"></textarea><button class="save">Save</button></td>';
			babeOutput += '<td><div class="bombshell"><a href="SEND" class="bombsaway">BOMBS AWAY!</a></div> <br /> <form> <div style="text-align:center;"> <input class="manual" type="checkbox" name="manuallymessaged '+ babesArr[i].user +'" value="manual">Messaged manually?</input><br /><br /> <input class = "reject" type="checkbox" name="reject '+ babesArr[i].user +'" value="reject">Reject?</input><br /> </div> </form> </td>'; 
			babeOutput += '</tr>'
		}    
		$('#gtable > tbody').append(babeOutput);
	};
    
	var setEventListeners = function(babes) {
		$('input.reject').click(function(){
		    if($(this).is(':checked')){
		    	var babeToReject = $(event.target).attr('name').replace("reject ","");
		        if (confirm("Are you sure you want to reject? She might be pretty cool.")) {
		        	$('tr.'+babeToReject).fadeOut("slow");	
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
		        	$('tr.'+babeManuallyMessaged).fadeOut("slow");	
		        } else {
		        	$(this).prop('checked', false);
		        }
		        //Also need to push manually messaged status to database
		    }
		});
	};

	var updateMessage = function(babesArr) {
		$(window).load(function(){  
	    	$('input').click(function(event){  //Captures all of the checked boxes that match the class of the box checked or unchecked
				var clickedName = $(event.target).attr('class');
				var valuesArr = $('input:checkbox:checked.' + clickedName).map(function () { 
			 	return this.value;
			}).get();
			
			if (clickedName != "manual" && clickedName != "reject") { //Prevent code from being run if the class of input being clicked was the 'reject' or 'manual message' button
				//Process the new message
				var leadIn;
				var finalMessage = "";
				var fullArray = [];
				var finalMessageUpdate = "";
				var arrNumber; //This will store the position of the clickedName in the JSON file
				var babeToUpdate; //This will be a shortcut for which babe should be updated once identified with arrNumber
				
				//This new function should find the number in the array based on the username (i.e. clickedName), 
				//and then cycle through the keywords that are found in valuesArr 
				
				
				for (var i = 0; i < babesArr.length; i++) {
					if (babesArr[i].user == clickedName) { 
						arrNumber = i;
						babeToUpdate = babesArr[arrNumber].matched
					} 
				} //Identifies which babe's keyword was clicked on
				
				for (var k = 0; k < babeToUpdate.length; k++) {
					if ($.inArray(babeToUpdate[k].keyword, valuesArr) != -1) {
						fullArray.push(babeToUpdate[k].message);
					} 
				} //Cycles through keywords, identifies which are in the valuesArr, and pushes the associated message to fullArray
				
				for (var l = 0; l < fullArray.length; l++) {
					if (l === 0) {leadIn = "Heya, how's it going? ";} else if (l===1){leadIn = "Also, ";} else {leadIn = "Oh, and ";}
					finalMessageUpdate += leadIn + fullArray[l] + "<br /><br />";
				} //Generates the final message
								
				$('#'+clickedName+'message').html('<p>' + finalMessageUpdate + 'Jon</p>'); //Now, identify the correct td to replace with new HTML
			}
	 		}); 

			//This is where we can manually edit shit. Taken from: http://www.tonylea.com/2010/jquery-easy-editable-text-fields/
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
		});
	};

	

	$.ajax({  
        url: '/api/samples/sample multiples.json',
        type: 'GET',
        success: function(response){
            if('babes' in response){
                var babesArray = response.babes;
                listEmOut(babesArray);
				setEventListeners(babesArray);
				updateMessage(babesArray);
            }
        },
        error: function(xhr){
            console.log('Problem fetching from babe API', xhr);
        }
    }); //Alex-written code that captures JSON file from API call. This happens first on the page. 



})(jQuery);



