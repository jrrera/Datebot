/*
 * @desc: phantom script to recursively crawl cupid URL passed in thru stdin arg
 * @return: array of matches - JSON encoded thru stdout
 */

// Run with phantomjs --debug=yes --proxy-auth=alexanderscott4:datebot1234 --cookies-file=cupid-cookies.txt cookie-auth.js

// Run with config file in phantom folder by:   phantomjs /tests/cookie-auth.js --config=/config/config-proxy.json

var fs = require('fs'),
    sys = require('system'),
    page = require('webpage').create(),
    time;

page.settings.userName = "alexanderscott4";
page.settings.password = "datebot1234";
page.settings.userAgent = "Mozilla/5.0 (Windows NT 6.1; rv:9.0) Gecko/20100101 Firefox/9.0";

var localCookies = require('./local-cookies.json');

function createScreenshot(){
    var days, today;
    phantom.create(function(ph) {
      return ph.createPage(function(page) {
        page.set('viewportSize', { width: 1000, height: 1000 });
        page.set('clipRect', { top: 0, left: 0, width: 1000, height: 1000 });
        return page.open(url, function(status) {
          console.log("Rendering screenshot ...");
          return setTimeout((function() {
            return createScreenshot(page, 'output.png');
          }), 1000);
        });
      });
    });
}

function addCupidCookie(cookie){
    return page.addCookie({
        'name':     cookie.name,   /* required property */
        'value':    cookie.value,  /* required property */
        'domain':   cookie.domain,           /* required property */
        'path':     cookie.path,
        'httponly': cookie.httponly,
        'secure':   cookie.secure,
        'expires':  cookie.expires
        //'expires':  (new Date()).getTime() + 3600   [> <- expires in 1 hour <]
    });
}

function loadPage(url){

    localCookies.forEach(function(val, i, arr){
        if(addCupidCookie(val)){
            console.log('cookie added: ', JSON.stringify(val));
        } else {
            console.log('cookie could not be added: ', JSON.stringify(val));

        }

        console.log(i);
        if((i+1) === arr.length){
            console.log(page.cookies);


            console.log(JSON.stringify(page.cookies, null, '\t'));

            page.open(url, function (status) {
                if (status !== 'success') {
                    console.log('FAIL to load the address');
                } else {
                    time = Date.now();
                    var cookie = page.evaluate(function() {
                        return document.cookie; // => "test=test-value;"
                    });
                    page.render('./screens/datebot-'+time.toString()+'.png');

                    console.log(JSON.stringify(page.cookies, null, '\t'));

                    //console.log(page.cookies);
                    fs.write('./tests/cupid-cookies.json', JSON.stringify(page.cookies, null, '\t'), 'w');
                    //console.log(phantom.cookies);
                    //fs.write('./tests/phantom-cookies.json', JSON.stringify(phantom.cookies), 'w');
                    phantom.exit();

                }
            });
        }
    });

}


loadPage('http://www.okcupid.com/home');



