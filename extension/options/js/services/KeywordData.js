keywordsApp.factory('keywordData', function($http, $log, $q, $rootScope){

	return {
        getKeywords: function($scope) {
        	var deferred = $q.defer();

			chrome.storage.local.get('dbotKeywords', function(result) {
				if (result.dbotKeywords) {
					$scope.$apply(function(){
						deferred.resolve(angular.fromJson(result.dbotKeywords))
					});							
				} else {
	        		console.log('no keywords found. giving defaults');
	        		var defaultKeywords = {
	        			"opener":"Hey, how's it going?\n\n", 
	        			"closer":"Cheers,\n{Name}", 
	        			"first_transition" : "Also,",
	        			"second_transition" : "Oh, and",
	        			"pairs": [
	        				{
	        					"keyword": "cooking",
	        					"message": "I'm really into cooking too. Do you have a specialty dish? Mine's {{INSERT DISH NAME HERE}}."
	        				},
	        				{
	        					"keyword": "travel",
	        					"message": "How was traveling in {{COUNTRY/STATE/PLACE}}? I've been to {{COUNTRY/STATE/PLACE}} and had an amazing time."
	        				},
	        				{
	        					"keyword": "foodie",
	        					"message": "I'm a total foodie too. Have you ever been to {{PLACE}} in {{NEIGHBORHOOD}}? It's unbelievable."
	        				},
	        				{
	        					"keyword": "thai",
	        					"message": "Thai food is my absolutely favorite right now. Have you been to {{PLACE}} in {{NEIGHBORHOOD}}? It's fantastic."
	        				},
	        				{
	        					"keyword": "barhopping",
	        					"message": "Since moving here, I've been loving the bar scene. What's your favorite bar? I'm pretty fond of {{BAR}}."
	        				},
	        				{
	        					"keyword": "game of thrones",
	        					"message": "I definitely share your love for Game of Thrones. Who's your favorite character? I'd have to give it to Jon Snow on that one."
	        				},
	        			]
	        		};
	        		$scope.$apply(function(){
	        			deferred.resolve(defaultKeywords);
	        		});
				}
			});
				
			return deferred.promise;
        },


		saveKeywords: function(keywordObj) {
			var keywordJson;

			for (var i = 0; i < keywordObj.pairs.length; i++) {
				keywordObj.pairs[i].keyword = keywordObj.pairs[i].keyword.toLowerCase(); //Converts all keywords to lower case, since everything is matched to OKC profile in lower case
			}

			keywordJson = JSON.stringify(keywordObj);
			
			chrome.storage.local.set({'dbotKeywords': keywordJson}, function(){});

			//this.generateExport(keywordObj); //Updates the export file
		},

		generateExport: function(keywordObj) {

			//Filer system code from: http://www.html5rocks.com/en/tutorials/file/filesystem/#toc-file-creatingempty
			
			function errorHandler(e) {
			  var msg = '';

			  switch (e.code) {
			    case FileError.QUOTA_EXCEEDED_ERR:
			      msg = 'QUOTA_EXCEEDED_ERR';
			      break;
			    case FileError.NOT_FOUND_ERR:
			      msg = 'NOT_FOUND_ERR';
			      break;
			    case FileError.SECURITY_ERR:
			      msg = 'SECURITY_ERR';
			      break;
			    case FileError.INVALID_MODIFICATION_ERR:
			      msg = 'INVALID_MODIFICATION_ERR';
			      break;
			    case FileError.INVALID_STATE_ERR:
			      msg = 'INVALID_STATE_ERR';
			      break;
			    default:
			      msg = 'Unknown Error';
			      break;
			  };

			  console.log('Error: ' + msg);
			}

			function onInitFs(filesystem) {

			  var fs = filesystem, url;
			  
			  fs.root.getFile('dbot_export.txt', {create: false, exclusive: true}, function(fileEntry) {

			    // Create a FileWriter object for our FileEntry (log.txt).
			    fileEntry.createWriter(function(fileWriter) {

			      fileWriter.onwriteend = function(e) {
			        console.log('Write completed.');
			      };

			      fileWriter.onerror = function(e) {
			        console.log('Write failed: ' + e.toString());
			      };

			      // Create a new Blob and write it to log.txt.
			      var keywords = localStorage["dbotKeywords"];
			      var blob = new Blob([keywords], {type: 'application/json'});

			      fileWriter.write(blob);
			      console.log('fileEntry', fileEntry.toURL());
			      
			      url = fileEntry.toURL(); //Puts the file URL on the scope

			      $rootScope.$apply(function(){
			      	deferred.resolve(url); //Returns the URL location of the file for downloading
			      });

			    }, errorHandler);
			  }, errorHandler);
			}

			var deferred = $q.defer();
						
			window.requestFileSystem  = window.requestFileSystem || window.webkitRequestFileSystem;
			window.requestFileSystem(window.TEMPORARY, 1024*1024, onInitFs, errorHandler);

			return deferred.promise;			
		},

		checkForExistingKeywords: function(keyword, pairs) {
		  pattern = new RegExp("^" + keyword + "$", "i"),
		  match = false;
		
		  for (var i = 0; i < pairs.length; i++) {
		    if (pattern.test(pairs[i].keyword) === true) {
		      match = true;
		      console.log("We found a match! It was: ", existingKeywords[i]);
		      return match;
		    }
		  }
		  return match;
		},

		trimKeyword: function(str) {
			return str.replace(/^\s\s*/, '').replace(/\s\s*$/, '');
		}

		// keywordsAjax: function() {
		// 	var deferred = $q.defer(); //$q service uses async promises so you're not nesting callbacks on callbacks on callbacks

		// 	$http({method: 'GET', url:'http://dbotapp.appspot.com/keywords'}).
		// 		success(function (data, status, headers, config){
		// 			var finalJson = angular.fromJson(data);
		// 			$log.info('Success!');
		// 			$log.info(finalJson);
		// 			$log.info(finalJson.opener);
		// 			deferred.resolve(finalJson);
		// 		}).
		// 		error(function (data, status, headers, config) {
		// 			deferred.reject(status);
		// 			$log.warn(status, headers);
		// 		});

		// 	return deferred.promise;			
		// },
		// getUsername: function() {
		// 	try {
		// 		var username = localStorage["dbotUser"];
		// 		console.log('Username is:', username);
		// 		if (username.length === 0) {
		// 			return '';
		// 		} else {
		// 			return username;
		// 		}
		// 	}
		// 	catch(e) {
		// 		console.log('No username found.')
		// 		return '';
		// 	}
		// },
		//Outdated code on posting to AppEngine:
		//			// if (username === 'jrrera' || username ==='jrrera@gmail.com') { //Only works for my username so far
			// 	$http({
			// 		method: 'POST', 
			// 		url:'http://dbotapp.appspot.com/keywords',
			// 		//url:'http://localhost:8080/keywords', //for testing
			// 		dataType: 'json',
	  //   			data: {
			//           "username": username,
			//           "keywords": keywordObj,
	  //        		},
	  //   			headers: {
	  //       			"Content-Type": "application/json"
	  //   			}
	  //   		}).
			// 		success(function (data, status, headers, config){
			// 			$log.info('Success in saving to App Engine!');
			// 		}).
			// 		error(function (data, status, headers, config) {
			// 			$log.warn(status, headers);
			// 		});	
			// }
	};
});