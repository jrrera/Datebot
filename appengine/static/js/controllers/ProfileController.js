'use strict';

scraperApp.controller('ProfileController', 
	function ProfileController($scope, $timeout, $filter, $log, $modal, ScraperData, SuccessReceiver) {
		
		var sd = ScraperData; //shorthand for coding
		var sr = SuccessReceiver;

		$scope.loading = true;
		$scope.username = sd.getUsername();
		$scope.profiles = []; //Profile objects will be pushed here after processing.
		$scope.toggleMessaged = false; //Shows already-messaged results. Turned off by default


		sr.register($scope); //Registeres this controller as one that should receive updates from SuccessReceiver
		$scope.successes = sr.users; //Syncs with list of successfully messaged users in this session
		console.log('SuccessReceivers service array of users:', sr.users);
		
		$scope.keywords = sd.getKeywords("jrrera@gmail.com"); //This may need to be put inside sd.getProfiles.then() since this will also be async once calling from database
		
		sd.getProfiles($scope.username)
			.then(function(data){
				angular.forEach(data, function(profileObj){

					//Returns an array of - in order - okcText, okcContext (for matched interests), the picture URL, and the jquery object
					var jqueryArr = sd.turnIntoJquery(profileObj.html);

					//Returns an array of objects (the essays scraped from the profile)
					var okcContext = sd.processContext(jqueryArr[3]);

					//Processes the profile text with find-and-replace
					jqueryArr[0] = sd.processProfileText(jqueryArr[0]); 

					//Adds the okcContext as the fifth item in the jqueryArr array
					jqueryArr.push(okcContext);

					//Create the final profile object to send to the front-end
					profileObj = {
						okcText: jqueryArr[0],
						okcUsername: jqueryArr[1],
						okcPicture: jqueryArr[2],
						okcContext: jqueryArr[4],
						id: profileObj.id,
						messaged: profileObj.messaged,
						matches: sd.findSimilarities(jqueryArr[0], $scope.keywords, jqueryArr[4]) //Generates the object that the Chrome extension front end looks for
					}
					
					$scope.profiles.push(profileObj);

				});
				console.log($scope.profiles);
				$scope.loading = false;
			});

		$scope.open = function (user, profile) { //Function for initializing a modal instance

		  var modalInstance = $modal.open({
		    templateUrl: 'myModalContent.html',
		    controller: ModalInstanceCtrl,
		    resolve: {
		      profile: function () {
		        return profile;
		      },
		      user: function() {
		      	return user;
		      }
		    }
		  });
		};
	}
);