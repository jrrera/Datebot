scraperApp.factory('ScraperData', function($http, $log, $q){
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

		getProfiles: function(username) {
			//Will eventually take username into account
			console.log('Let us grab that profile!');
			var deferred = $q.defer(); //$q service uses async promises so you're not nesting callbacks on callbacks on callbacks

			$log.info("Username is", username);
			
			$http({method: 'GET', url:'http://localhost:8080/getscrapes'}).
				success(function (data, status, headers, config){
					var finalJson = angular.fromJson(data);
					$log.info('Success!');
					$log.info(finalJson.profiles);
					deferred.resolve(finalJson.profiles);
				}).
				error(function (data, status, headers, config) {
					deferred.reject(status);
					$log.warn(status, headers);
				});

			return deferred.promise;			
		},

		processProfileText: function(profile) {
			  //This function removes the built-in OKC text headers, changes problematic double quotation marks to singles, and removes unnecessary spacing. 
			  var replace1 = "my self-summary";
			  var replace2 = "what i\u2019m doing with my life";
			  var replace3 = "the first things people usually notice about me";
			  var replace4 = "favorite books, movies, shows, music, and food";
			  var replace5 = "the six things i could never do without";
			  var replace6 = "i spend a lot of time thinking about";
			  var replace7 = "on a typical friday night i am";
			  var replace8 = "the most private thing i\u2019m willing to admit";
			  var replace9 = "i\u2019m looking for";
			  var replace10 = new RegExp('"', "g");
			  var replace11 = "            ";

			  var findreplace = [replace1,replace2,replace3,replace4,replace5,replace6,replace7,replace8,replace9,replace11];
			  
			  var textUpdate = profile;
			  for (var i = 0; i < findreplace.length; i++) {
			    textUpdate = textUpdate.replace(findreplace[i],"");
			  }
			    textUpdate = textUpdate.replace(replace10, "'");
			    textUpdate = textUpdate.replace(/(\r\n|\n|\r)/gm," ");
			    textUpdate = textUpdate.replace(/\s+/gm, " ");
			  return textUpdate;
		},

		turnIntoJquery: function(html) {
			var htmlObj = $(html);

			var okcText = htmlObj.find("#main_column").text().toLowerCase();
			var okcUserName = htmlObj.find('#basic_info_sn').text();
			var okcPicture = htmlObj.find('#thumb0 img').attr('src');
			return [okcText, okcUserName, okcPicture, htmlObj];
		},

		processContext: function(htmlObj){
			var contextArr = [], name, essay, finalEssay;

            for (var i = 0; i < 9; i++) {
                var contextObj = {};

                name = htmlObj.find('#essay_'+i+'> a').text();
                essay = htmlObj.find('#essay_text_'+i).text();

                finalEssay = essay.replace(/\n/gi," ");

                contextObj.name = name;
                contextObj.essay = finalEssay;

                contextArr.push(contextObj);
            }

            return contextArr;
        },

        getKeywords: function(username, successcb) {
        	//Will set up a promise and a .then() once switching over to AJAX
        	var deferred = $q.defer();
        	if (username === 'jrrera' || username === 'jrrera@gmail.com') {
        		//Reenable once app is live
        		// $http({method: 'GET', url:'http://dbotapp.appspot.com/keywords?user='+username}).
        		// 	success(function (data, status, headers, config){
        		// 		var finalJson = angular.fromJson(data);
        		// 		localStorage["dbotKeywords"] = JSON.stringify(finalJson);
        		// 		return finalJson;
        		// 	}).
        		// 	error(function (data, status, headers, config) {
        		// 		$log.warn(status, headers);
        		// 	});	
        		finalJson = {"closer": "Happy Saturday!\nJon", "pairs": [{"message": "It's awesome that you go to so many shows. I've been going to as many as possible since moving here. Any favorite shows as of late?", "keyword": "going to shows"}, {"message": "What are some of your favorite parts of Oakland? I'm relatively new to the area, and hoping to explore that area more.", "keyword": "oakland"}, {"message": "I'm an INTJ, and also believe in balance as key. The perfect weekend includes just as much personal time as it does being with others.", "keyword": "istj"}, {"message": "I completely agree with the way you view the world, and the people in it. People are so interesting! (Especially in this city.) Do you have any favorite moments from riding/walking around SF?", "keyword": "different types of people"}, {"message": "I saw the first episode of Orange is the New Black this past weekend and now I'm totally hooked. Time to renew my Netflix account, haha. Have you ever seen Party Down? My other favorite series on Netflix.", "keyword": "orange is the new black"}, {"message": "I'm Jewish too. Did you grow up in a religious household? I grew up in a super kosher household, so my first cheeseburger was an act of rebellion when I was in high school haha.", "keyword": "jewish"}, {"message": "How did you like Israel, by the way? I've been twice, and I've loved every experience I had there.", "keyword": "israel"}, {"message": "I love Thai food too. I'd go crazy if I went for more than a few weeks without pad thai haha. What's your favorite dish?", "keyword": "thai"}, {"message": "I noticed you listen to Skrillex -- that's actually how I got into dubstep haha. Do you listen to any other dubstep artists?", "keyword": "skrillex"}, {"message": "I'm really into trance music too. Any favorite DJs? Gareth Emery is my all-time favorite.", "keyword": "trance"}, {"message": "It's awesome that you have a blog. I've been blogging for a while now too. What do you like to write about?", "keyword": "blog"}, {"message": "It's awesome that you blog. I've been blogging for a while now too. What do you like to write about?", "keyword": "blogging"}, {"message": "I'm in marketing as well. What kind of marketing do you do?", "keyword": "marketing"}, {"message": "I'm in advertising as well. What kind of advertising do you do?", "keyword": "advertising"}, {"message": "Your taste in TV is outstanding. Parks and Rec is one of my all-time favorites. Have you ever seen Party Down? It stars Adam Scott, and you'd love it if you like Parks and Rec. You should definitely check it out.", "keyword": "parks and rec"}, {"message": "I'm from New York as well (just moved from NYC a few months ago). How did you like living there versus living here?", "keyword": "nyc"}, {"message": "I work in tech too. How do you like working in this industry? So far, I'm loving it.", "keyword": "tech"}, {"message": "I've been obsessed with brunch ever since moving here (never really ate brunch in NY). What's your favorite brunch spot?", "keyword": "brunch"}, {"message": "I'm really into holistic health too \u2013 I've been gluten-free/dairy-free for a few years now, and really focusing on nutrition as of late. How did you first get into a more holistic approach to health?", "keyword": "holistic health"}, {"message": "How did you like Israel, by the way? I've been twice, and I've loved every experience I had there.", "keyword": "israel"}, {"message": "I'm really into EDM music too. Which genres do you like? I'm mostly into house, electro, and dubstep.", "keyword": "edm"}, {"message": "I noticed you listen to Skrillex -- that's actually how I got into dubstep haha. Do you listen to any other dubstep artists?", "keyword": "skrillex"}, {"message": "I'm pretty into dubstep too. Any favorite artists?", "keyword": "dubstep"}, {"message": "I am obsessed with Seven Lions. Have you seen him live? He's incredible.", "keyword": "seven lions"}, {"message": "I'm from New York as well (just moved from NYC a few months ago). How did you like living there versus living here?", "keyword": "new york"}, {"message": "Your taste in TV is awesome, by the way. Parks and Rec is one of my all-time favorites. Have you ever seen Party Down? It stars Adam Scott, and you'd love it if you like Parks and Rec. You should definitely check it out.", "keyword": "parks and recreation"}, {"message": "I'm a big fan of Indian food too. Do you have a favorite Indian restaurant in the Bay area? I'm still pretty new to the city, and could definitely use a suggestion or two :).", "keyword": "indian"}, {"message": "I've been traveling a lot lately too. Mostly just exploring different parts of the country, but I have a trip to Asia planned for later this year! If you had to choose your favorite country that you've traveled to, what would it be?", "keyword": "travel"}, {"message": "40 Year Old Virgin is one of my favorite movies of all time. Judd Apatow is a genius, haha. Have you seen Get Him to the Greek? Also amazing, but didn't get as much publicity for some reason.", "keyword": "40 year old virgin"}, {"message": "I'm into Game of Thrones too (mildly obsessed at this point). The end of season 3 blew my mind. Who's your favorite character?", "keyword": "game of thrones"}, {"message": "I couldn't live without coffee either, haha. Do you have any favorite coffee shops? Philz in the Mission really takes the cake for me (that stuff is rocket fuel).", "keyword": "coffee"}, {"message": "My last job was at a startup in the wine industry. How do you like startup life? It's intense, but I loved all of the beer and ping pong in the office, haha.", "keyword": "startup"}, {"message": "I love your taste in movies. Pulp Fiction is one of my all-time favorite films. Are you a fan of Tarantino's other movies? I thought Django Unchained was pretty awesome too.", "keyword": "pulp fiction"}, {"message": "Love your taste in TV. Whenever I'm in a rut, I always remember, there's always money in the banana stand.", "keyword": "arrested development"}, {"message": "I'm a total foodie too. Have you ever been to Radish, or 20 Spot in the Mission? Both are unbelievable.", "keyword": "foodie"}, {"message": "I have to say, one of the best things about SF is the amazing selection of dive bars. What's your favorite? I'd have to go with Clooney's in the Mission.", "keyword": "dive bars"}, {"message": "I'm actually traveling to Thailand later this year! How did you enjoy being there?", "keyword": "thailand"}, {"message": "I just recently moved to SF from the east coast, and the options for hiking here are amazing. Any favorite trails? I just finished walking around Land's End ... amazing!", "keyword": "hiking"}, {"message": "I'm mildly obsessed with Korean BBQ. I could live off of bulgogi burgers. Any favorite Korean places in the city?", "keyword": "korean bbq"}, {"message": "{{Not populated with data yet}}", "keyword": "eating/drinking"}, {"message": "I enjoy baking too (most gluten-free pastries and cookies). Do you have a baking specialty?", "keyword": "baking"}, {"message": "John Adams is an amazing series! It my first introduction to HBO, and I've been hooked ever since.", "keyword": "john adams"}, {"message": "Love your taste in TV. I was hooked on Breaking Bad for the first three seasons, but had to take a break from the intensity. Are you up to date?", "keyword": "breaking bad"}, {"message": "I really enjoy writing too (mostly blogging). What do you typically write about?", "keyword": "writing"}, {"message": "I don't think I could live without a Trader Joe's nearby. The chocolates and baked goods they have are incredible. What's your favorite food to buy there?", "keyword": "trader joe's"}, {"message": "I love house music as well. Any favorite venues in SF? I'm really fond of Ruby Skye and Monarch.", "keyword": "house"}, {"message": "I've been traveling a lot lately too. Mostly just exploring different parts of the country, but I have a trip to Asia planned for later this year! If you had to choose your favorite country that you've traveled to, what would it be?", "keyword": "travelling"}, {"message": "I've been traveling a lot lately too. Mostly just exploring different parts of the country, but I have a trip to Asia planned for later this year! If you had to choose your favorite country that you've traveled to, what would it be?", "keyword": "traveling"}, {"message": "Love your taste in music. House/electro is one of my favorite genres (especially for running). If you had to choose a #1 favorite DJ, who would it be?", "keyword": "wolfgang gartner"}, {"message": "Love your taste in music. House/electro is one of my favorite genres (especially for running). If you had to choose a #1 favorite DJ, who would it be?", "keyword": "dada life"}, {"message": "My burrito combinations are pretty strange as well. What's the weirdest thing you've added in yours? Mine is definitely coconut ice cream (don't judge :X).", "keyword": "strange burrito combinations"}, {"message": "I'm a big fan of bucket lists. How's yours coming along? One item on mine was to learn to cook Indian food, and I finally marked that off this weekend.", "keyword": "bucket list"}, {"message": "I love to cook too. Do you have any specialty dishes? I'd have to go with massaman curry, or this Texas-style chili recipe I stumbled upon last month (so good!).", "keyword": "cook"}, {"message": "I love your taste in music. W&W is amazing. Have you ever listened to Ummet Ozcan. He did a collab with W&W (Thunder), and I've been a fan of his ever since. He's pretty solid live too.", "keyword": "w&w"}, {"message": "I love your taste in music. If you had to pick a favorite house/electro artist, who would you go with?", "keyword": "nervo"}, {"message": "I love your taste in music. I saw Gareth Emery last year at EDC NY and I've been obsessed with him ever since. Have you had a chance to see him live?", "keyword": "gareth emery"}, {"message": "I love your taste in music. Nero's Welcome Reality was what first got me into dubstep. Have you seen them live yet? They're incredible.", "keyword": "nero"}, {"message": "I love your taste in music. Pendulum's Immersion album was what first got me into electronic music. Amazing stuff. I wish I could've seen them live before they split.", "keyword": "pendulum"}, {"message": "I love to cook too. Do you have any specialty dishes? I'd have to go with massaman curry, or this Texas-style chili recipe I stumbled upon last month (so good!).", "keyword": "cooking"}, {"message": "Gin is always a great choice (gin and soda is my go-to drink when I'm out). For some reason, gin doesn't give me nearly as bad of a hangover. Go figure.", "keyword": "gin"}, {"message": "I also think a lot about why people do what they do. I'm not sure if you've ever read them, but books like The Happiness Hypothesis and How Proust Can Change Your Life are pretty good reads on the topic of why people live the way they do.", "keyword": "why people do what they do"}, {"message": "I ran into an Inigo Montoya reference at a bar in the Mission two nights ago, and I got really excited haha. (I can be such a movie nerd sometimes.)", "keyword": "princess bride"}, {"message": "How did you like living in Seattle? I was just visiting there a few months ago (mostly in Capital Hill).", "keyword": "seattle"}, {"message": "Ever since moving here, I don't think I could do without chocolate either. Dandelion Chocolate is a 7 minute walk from my apartment (so dangerous). Do you have a favorite chocolate?", "keyword": "chocolate"}, {"message": "I'm big on wine too. My last job was in the wine industry, so it's hard not to get hooked! It's crazy how much knowledge and expertise goes into creating a good wine. What's your favorite type of wine? I'd have to go with Syrah or a dry Riesling.", "keyword": "wine"}, {"message": "Love your taste in music. House is one of my favorite genres (especially for running). If you had to choose a #1 favorite DJ, who would it be?", "keyword": "morgan page"}, {"message": "I'm a sucker for a good music festival too. Are you going to Outside Lands this year?", "keyword": "music festivals"}, {"message": "Your taste in TV is pretty awesome. Parks and Rec is one of my all-time favorites. Have you ever seen Party Down? It stars Adam Scott, and you'd love it if you like Parks and Rec. You should definitely check it out.", "keyword": "parks & rec"}, {"message": "I'm from New York as well (just moved from NYC a few months ago). How did you like living there versus living here?", "keyword": "ny"}], "second_transition": "Oh, and", "first_transition": "Also,", "opener": "Hey, how's it going? Your profile is pretty awesome, so I thought I'd say hi.\n\n"}
        		localStorage["dbotKeywordsTest"] = JSON.stringify(finalJson);
        		return angular.fromJson(finalJson);

        	} else if (localStorage["dbotSaveUser"] === username) {
        		var finalJson = angular.fromJson(localStorage["dbotKeywords"]); //This is for users who store everything on local storage
        		return finalJson;

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
        		return exampleJson; //Used for people without any keyword data yet
        	}
        },

        findSimilarities: function(profile, keywords, context) {

        	function extractContext(response, keywords, essays) {
        	  //console.log("This is what we're extracting context from: ", response);
        	  var contextArr = [], findKeyword, essayTitle, final;
        	  for (var i = 0; i < keywords.length; i++) {
        	    findKeyword = new RegExp('([^a-zA-Z]|\n|\r|\r\n)' + keywords[i] + '([^a-zA-Z]|\n|\r|\r\n)', 'g');

        	    if (response.search(findKeyword) != -1) {

        	      essayTitle = findEssayTitle(keywords[i], essays);
        	      var contextGrabber = response.match(new RegExp('\S{0,10}(\n|.){0,50}([^a-zA-Z]|\n|\r|\r\n)' + keywords[i] + '([^a-zA-Z]|\n|\r|\r\n)(\n|.){0,50}\S{0,10}', 'g')); //This RegEx finds the keyword, and on either side, adds a space (to capture only the whole word), and then captures all line breaks or characters 50 characters in either direction. Then, extends up to another 10 characters to finish at the nearest whole word
        	      
        	      final = essayTitle + contextGrabber[0];
        	      contextArr.push(final);
        	    }
        	  } 
        	  return contextArr;
        	}

        	function findEssayTitle(keyword, essays){
        	  //console.log(keyword);
        	  //console.log("essays", essays);
        	  var final;
        	  var keywordRe = new RegExp('[^a-zA-Z]' + keyword + '[^a-zA-Z]', 'i');

        	  for (var i = 0; i < essays.length; i++) {
        	    var essay = essays[i].essay;
        	    //console.log("Now looking through this essay: ", essay);
        	    if (essay.search(keywordRe) != -1) {
        	      //console.log("Found a match for " + keyword + ": " + essays[i].name);
        	      final = '<strong>' + essays[i].name + '</strong><br />';
        	      return final;
        	    } 
        	  }
        	  return "<strong>Unknown</strong><br />";
        	}

        	function extractMatchedKeywords(response, keywords) {
        	  var matchedKeywords = [];
        	  var findKeyword;
        	  for (var i = 0; i < keywords.length; i++) {
        	    findKeyword = new RegExp('[^a-zA-Z]' + keywords[i] + '[^a-zA-Z]', 'g');
        	    if (response.search(findKeyword) != -1) {
        	      matchedKeywords.push(keywords[i]);
        	    }
        	  } 
        	  //console.log(matchedKeywords);
        	  return matchedKeywords;
        	}

        	//Begin calculating final keywords and final context for this match
        	//console.log("keywords", keywords);
        	
        	var desiredKeywords = [], desiredMessage = [], finalMessage = [];

        	for (var i = 0; i < keywords.pairs.length; i++) {
        	  desiredKeywords.push(keywords.pairs[i].keyword);
        	  desiredMessage.push(keywords.pairs[i].message);
        	}

        	//console.log("desiredKeywords", desiredKeywords);

        	var finalKeywords = extractMatchedKeywords(profile, desiredKeywords);
        	var finalContext = extractContext(profile, desiredKeywords, context);

        	for (var i = 0; i < finalKeywords.length; i++) {
        	  if (desiredKeywords.indexOf(finalKeywords[i]) != -1) {
        	    var index = desiredKeywords.indexOf(finalKeywords[i]);
        	    finalMessage.push(desiredMessage[index]);  
        	  }
        	}

        	finalResult = {
        		opener: keywords.opener.replace("\n", "<br />"),
        		closer: keywords.closer.replace("\n", "<br />"),
        		first_transition: keywords.first_transition,
        		second_transition: keywords.second_transition
        	};

        	finalResult.matched = [];

        	for (var i = 0; i < finalKeywords.length; i++) {
        		var oneMatchObj = {};

        		oneMatchObj.keyword = finalKeywords[i];
        		oneMatchObj.context = finalContext[i];
        		oneMatchObj.message = finalMessage[i];

        		if (i == 0 || i == 1) {
        			oneMatchObj.checked = true;
        	    } else {
        	    	oneMatchObj.checked = false;
        	    }

        	    finalResult.matched.push(oneMatchObj);
        	}
        	
        	//console.log('finalResult', finalResult);
        	return finalResult;
        }
	};
});