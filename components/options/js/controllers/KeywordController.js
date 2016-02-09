'use strict';

keywordsApp.controller('KeywordController',
	function KeywordController($scope, $timeout, $filter, keywordData) {
		console.log('keyword controller initiated');
		$scope.interestsPage = true;
		$scope.loading = true;
		$scope.missingField = false;
		$scope.added = false; //Indicates if there is a keyword waiting to be added to the list from ContextMenu.
		$scope.sortorder = '';
		$scope.exportTurnOn = false; //Disables export button until file is ready

		keywordData.getKeywords().then(function(data) {
			console.log('initiating keyword grab');
			$scope.keyword = data.keywords;
			$scope.isNewUser = !data.fromStorage; // Nothing in storage? New user.
			$scope.loading = false; //Turns off loading notifications
			$scope.completed = true; //Turns on successful load notif
			$scope.keywordLength = $scope.keyword.pairs.length;

			//Generates the URL for exporting your keyword JSON to a .txt file and interaction data as JSON too
			$scope.exportUrl = keywordData.generateExport($scope.keyword);
			$scope.interactionExportUrl = keywordData.generateInteractionExport();

			$scope.exportTurnOn = true; //Makes the button clickable once exporting is done.

			$timeout(function(){
				$scope.completed = false;	//Turns off loading notification 5 seconds later
			}, 5000);

			//Logic for handling keywords passing via context menu across tabs
			if ($scope.added) {
			  console.log('A keyword is waiting!');
		      if (keywordData.checkForExistingKeywords($scope.newKeyword, $scope.keyword.pairs) === false) {
				$scope.keyword.pairs.unshift({'keyword':$scope.newKeyword, 'message':''}); //Add to top of keywords list
				keywordData.saveKeywords($scope.keyword); //Save the data
		      }
			}
		});

		$scope.handleFileSelect = function(evt) {
			var JsonObj,
		    	files = evt.target.files, // FileList object
		    	f = files[0],
		      	reader = new FileReader();

		      // Closure to capture the file information.
		      reader.onload = (function(theFile) {
		        return function(e) {
			        JsonObj = JSON.parse(e.target.result);
			        $scope.importedData = JsonObj;
			        console.log('imported data', $scope.importedData);
		        };
		      })(f);

		      reader.readAsText(f);
		};

		$scope.submitImport = function() {
			var keywords;
			console.log('data to replace current keywords', $scope.importedData);

			$scope.importOn = false;

			if (typeof $scope.importedData === 'object') {
				$scope.keyword = $scope.importedData
				keywords = JSON.stringify($scope.importedData);

				chrome.storage.local.set({'dbotKeywords': keywords}, function(){});
				$scope.importSuccess = true;
				$timeout(function(){
					$scope.importSuccess = false;
				}, 5000);
			} else {
				$scope.importFailure = true;
				$timeout(function(){
					$scope.importFailure = false;
				}, 5000);
			}
		};


		$scope.save = function() {
			keywordData.saveKeywords($scope.keyword); //Saves keywords to local storage
			keywordData.generateExport($scope.keyword); //Updates the export file
			$scope.saved = true;
			$scope.keywordLength = $scope.keyword.pairs.length;

			$timeout(function(){
				$scope.saved = false;
			}, 5000);
		};

		$scope.cancelEdit = function(){
			window.location = 'interests.html';
		};

		$scope.addRow = function(){
			$scope.sortorder = '';
			$scope.keyword.pairs.unshift({'keyword':'', 'message':''});
		};

		$scope.deleteRow = function(index){
			$scope.keyword.pairs.splice(index, 1);
		};

		$scope.recommendation = function(text) {
			//Coming soon
		};

		//This listener handles any new keywords sent in from the Context Menu (right click).
		chrome.runtime.onMessage.addListener(function (msg, sender, sendResponse) {
		  if (msg.newKeyword) {
		    console.log("contextMenus listener was triggered. We received this keyword:", msg.newKeyword);

		    var newKeyword = keywordData.trimKeyword(msg.newKeyword).toLowerCase();

		    if (newKeyword.length > 0) {
		    	if (!$scope.loading) { //Checks to see if the AJAX call has completed for the keywords yet. If loading = false, the process is complete, so we move forward as planned

			      if (keywordData.checkForExistingKeywords(newKeyword, $scope.keyword.pairs) === false){ //If no matching keywords were found, create it.

					//Run $scope.$apply because this data change happens in the chrome API callback
					$scope.$apply(function(){
						$scope.keyword.pairs.unshift({'keyword':newKeyword, 'message':''}); //Add to top of keywords list
						$scope.save(); //Save the data
					});
			      }

		    	} else {
			    	console.log('Keywords not loaded yet. Making $scope.added true!');

			    	//Run $scope.$apply because this data change happens in the chrome API callback
			    	$scope.$apply(function(){
						$scope.added = true; //Queues up this keyword to get added along with AJAX call still in progress
						$scope.newKeyword = newKeyword; //This is where the new keyword is held until the AJAX call finishes (See code above for how this gets handled)
			    	});

		    	}
		    }
		    sendResponse('Received!');
		  }
		});

		//Event listener for import feature
		document.getElementById('files').addEventListener('change', $scope.handleFileSelect, false);
	}
);
