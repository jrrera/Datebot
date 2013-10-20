'use strict';

keywordsApp.controller('KeywordController', 
	function KeywordController($scope, $timeout, $filter, keywordData) {
		$scope.loading = true;
		$scope.missingField = false;
		$scope.added = false; //Indicates if there is a keyword waiting to be added to the list from ContextMenu.
		$scope.sortorder = '';
		$scope.exportTurnOn = false; //Disables export button until file is ready
		$scope.username = keywordData.getUsername();

		keywordData.keywordsAjax($scope.username, function(data){
			$scope.keyword = angular.fromJson(data);
			$scope.loading = false; //Turns off loading notifications
			$scope.completed = true; //Turns on successful load notif

			//Generates the URL for exporting your keyword JSON to a .txt file
			keywordData.generateExport($scope.keyword).then(function(url){
				$scope.exportUrl = url;
				$scope.exportTurnOn = true; //Makes the button clickable once exporting is done.
			}); 

			$timeout(function(){
				$scope.completed = false;	//Turns off loading notification 5 seconds later
			}, 5000);
				
			//Logic for handling keywords passing via context menu across tabs		
			if ($scope.added) {
			  console.log('A keyword is waiting!');
		      if (keywordData.checkForExistingKeywords($scope.newKeyword, $scope.keyword.pairs) === false) {
				$scope.keyword.pairs.unshift({'keyword':$scope.newKeyword, 'message':'[[Requires a related message]]'}); //Add to top of keywords list
				keywordData.saveKeywords($scope.keyword); //Save the data
		      }
			}
		});

		$scope.updateUserData = function(username) { //Redundant code, but not sure how else to do this for username.
			localStorage["dbotUser"] = username;
			$scope.loading = true;
			keywordData.keywordsAjax(username, function(data){
				$scope.keyword = angular.fromJson(data);
				$scope.loading = false;
				$scope.completed = true; //Turns on successful load notif
				$timeout(function(){
					$scope.completed = false;	//Turns it off 5 seconds later
				}, 5000);
			});
		}

		$scope.save = function() {
			localStorage["dbotUser"] = $scope.username //This is what's populated in the username field, and can be changed
			localStorage["dbotSaveUser"] = $scope.username //This marks the last user to save data
			keywordData.saveKeywords($scope.username, $scope.keyword); //Saves keywords to local storage
			keywordData.generateExport($scope.keyword); //Updates the export file
			$scope.saved = true;
			
			$timeout(function(){
				$scope.saved = false;	
			}, 5000);
		}
		
		$scope.cancelEdit = function(){
			window.location = 'interests.html';
		}

		$scope.addRow = function(){
			$scope.sortorder = '';
			$scope.keyword.pairs.unshift({'keyword':'', 'message':''});
		}

		$scope.deleteRow = function(index){
			$scope.keyword.pairs.splice(index, 1);
		}
		

		$scope.recommendation = function(text) {

		}

		//This listener handles any new keywords sent in from the Context Menu (right click).
		chrome.runtime.onMessage.addListener(function (msg, sender, sendResponse) {
		  if (msg.newKeyword) {
		    console.log("contextMenus listener was triggered. We received this keyword:", msg.newKeyword);

		    var newKeyword = keywordData.trimKeyword(msg.newKeyword).toLowerCase();
		   
		    if (newKeyword.length > 0) {
		    	if (!$scope.loading) { //Checks to see if the AJAX call has completed for the keywords yet. If loading = false, the process is complete, so we move forward as planned
			      
			      if (keywordData.checkForExistingKeywords(newKeyword, $scope.keyword.pairs) === false){ //If no matching keywords were found, create it.
					$scope.keyword.pairs.unshift({'keyword':newKeyword, 'message':'[[Requires a related message]]'}); //Add to top of keywords list
					keywordData.saveKeywords($scope.keyword); //Save the data
			      }		    		
		    	
		    	} else {	    		
			    	console.log('Keywords not loaded yet. Making $scope.added true!');
			    	$scope.added = true; //Queues up this keyword to get added along with AJAX call still in progress
			    	$scope.newKeyword = newKeyword; //This is where the new keyword is held until the AJAX call finishes (See code above for how this gets handled)
		    	}
		    }
		    sendResponse('Received!');
		  }
		});	
	}
);