keywordsApp.factory('keywordData', function($http, $log, $q){
	return {
		getUsername: function() {
			try {
				var username = localStorage["dbotUser"];
				console.log('Username is:', username);
				if (username.length === 0) {
					return '';
				} else {
					return username;
				}
			}
			catch(e) {
				console.log('No username found.')
				return '';
			}
		},

		keywordsAjax: function(username, successcb) {
			if (username === 'jrrera') {
				$http({method: 'GET', url:'http://dbotapp.appspot.com/keywords'}).
					success(function (data, status, headers, config){
						var finalJson = angular.fromJson(data);
						localStorage["dbotKeywords"] = JSON.stringify(finalJson);
						return successcb(finalJson);
					}).
					error(function (data, status, headers, config) {
						$log.warn(status, headers);
					});	

			} else if (localStorage["dbotSaveUser"] === username) {
				var finalJson = angular.fromJson(localStorage["dbotKeywords"]); //This is for users who store everything on local storage
				return successcb(finalJson);

			} else { //No username found
				var exampleJson = {
					"opener":"Hey, how's it going?\n\n", 
					"closer":"Cheers,\n{Name}", 
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
				return successcb(exampleJson); //Used for people without any keyword data yet
			}
		},

		saveKeywords: function(username, keywordObj) {
			for (var i = 0; i < keywordObj.pairs.length; i++) {
				keywordObj.pairs[i].keyword = keywordObj.pairs[i].keyword.toLowerCase(); //Converts all keywords to lower case, since everything is matched to OKC profile in lower case
			}

			if (username === 'jrrera') { //Only works for my username so far
				$http({
					method: 'POST', 
					url:'http://dbotapp.appspot.com/keywords',
					//url:'http://localhost:8080/keywords', //for testing
					dataType: 'json',
	    			data: {
			          "username":"jrrera",
			          "keywords": keywordObj,
	         		},
	    			headers: {
	        			"Content-Type": "application/json"
	    			}
	    		}).
					success(function (data, status, headers, config){
						$log.info('Success in saving to App Engine!');
					}).
					error(function (data, status, headers, config) {
						$log.warn(status, headers);
					});	
			}

			localStorage["dbotKeywords"] = JSON.stringify(keywordObj);
			console.log('Saved to local storage!');
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
		// }
	};
});