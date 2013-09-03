/*
 * @desc:  app config - edit to tailor to you
 * @created:  09-02-2013
 * @TODO:  replace with values from DB
*/


// Set DEBUG constant for logging
if(typeof DEBUG === 'undefined') var DEBUG = true;


(function(window, document, DEBUG, chrome){

    var DateBot = DateBot || {}; 

    DateBot.config = DateBot.config || {
        name: "Alex",
        defaultMessage : "<p>Hey, how\'s it going? Just wanted to let you know that your profile "+
                         "is pretty awesome &ndash; very well written. Do you write in your spare time?<br /><br />"+DateBot.config.name+"</p>"

        
    
    
    
    
    };

    return DateBot.config;


})();

