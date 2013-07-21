/*
 * @desc: phantom script to recursively crawl cupid URL passed in thru stdin arg
 * @return: array of matches - JSON encoded thru stdout
 */

var fs = require('fs'),
    sys = require('system'),
    crawlURL = sys.args[1],
    matchedArr = [];

getMatches(crawlURL, 0);


function getMatches(crawlURL, pageIter){

    if(crawlURL === '' || typeof(crawlURL) === 'undefined' || crawlURL === false){      // No more to crawl, pass back data

        //console.log('DATEBOT-PHANTOM: Finished crawling');
        console.log(JSON.stringify(matchedArr));

        phantom.exit();

    } else {

        pageIter += 1;

        var page = require('webpage').create();

        page.open(crawlURL, function(status) {
            if (status === "success") {
                return page.includeJs('http://ajax.googleapis.com/ajax/libs/jquery/1.7.2/jquery.min.js', function() {

                    //setTimeout(function() {           //Set timeout/interval for making scrape requests
                    var matchListPage = page.evaluate(function() {
                        var matchesArr = [];

                        // Iterate using jquery and push into matchesArr
                        $('ul.matches').each(function(i, val){
                            var match = {};
                            match.location = $('#matchAlocation').text();
                            match.age = $('#matchAlocation').text();
                            matchesArr.push(match);
                        });

                        return matchesArr;
                    });

                    var nextURL = page.evaluate(function() {
                        var url = '';
                        return url;
                    });

                    page.release();

                    matchedArr = matchedArr.concat(matchListPage);

                    getMatches(nextURL, pageIter);

                });
            }
        });
    }
}
