/*
 * @desc: node script to assemble crawl URL and invoke phantom
 */

var fs = require('fs'),
    prefs = require('./config/match-criteria.json'),
    proxies = require('./config/proxies.json'),
    datebotUtils = require('./datebot-utils'),
    queryStrArr = [],
    queryStr = '',
    baseUrl = 'http://www.okcupid.com/match?';

queryStrArr = [
    'filter1=0,34',                  // Girls who like guys
    'filter2=2,'+prefs.ageLower+','+prefs.ageUpper,
    'filter3=3,25',                  // 25 miles from me
    'filter4=4,'+Datebot.utils.timeToSeconds(prefs.online_last),
    'filter5=1,1',                   // Have a photo
    'filter6=35,2',                  // Are single
    'keywords='+encodeURIComponent(prefs.keywords),
    'locid=0',                       // ???
    'timekey=1',                     // ???
    'matchOrderBy='+prefs.order_by.toUpperCase(),        // MATCH

    'custom_search=0',               // ???
    'fromWhoOnline=0',               // ???
    'mygender=m',
    'update_prefs=1',
    'sort_type=0',
    'sa=1'
];

queryStr = Datebot.utils.queryString(queryStrArr);


console.log('Crawling URL: ', baseUrl+queryStr, ' through proxy ', proxies[0].url);

require('child_process').exec('phantomjs ./phantom/get-matches.js ' + baseUrl+queryStr + ' --load-images=no --proxy='+proxies[0].url+' --proxy-type='+proxies[0].type, function(error, stdout, stderr){
    console.log('Called back with stderr: ', stderr);
    callback(stderr);       // stderr should be "null" if everything went well.
});
