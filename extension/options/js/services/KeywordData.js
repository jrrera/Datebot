keywordsApp.factory('keywordData', function($http, $log, $q){
	return {		
		keywordsAjax: function(successcb) {
			$http({method: 'GET', url:'http://dbotapp.appspot.com/keywords'}).
				success(function (data, status, headers, config){
					var finalJson = angular.fromJson(data);
					localStorage["keywords"] = JSON.stringify(finalJson);
					return successcb(finalJson);
				}).
				error(function (data, status, headers, config) {
					$log.warn(status, headers);
				});
		},

		saveKeywords: function(keywordObj) {
			for (var i = 0; i < keywordObj.pairs.length; i++) {
				keywordObj.pairs[i].keyword = keywordObj.pairs[i].keyword.toLowerCase(); //Converts all keywords to lower case, since everything is matched to OKC profile in lower case
			}

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
					$log.info('Success in saving!');
				}).
				error(function (data, status, headers, config) {
					$log.warn(status, headers);
				});	
			localStorage["keywords"] = JSON.stringify(keywordObj);
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