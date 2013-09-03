/*
 * @desc:  app globals, constants, config
 * @created:  09-02-2013
*/


// Set DEBUG constant for logging
if(typeof DEBUG === 'undefined') var DEBUG = true;


DateBot = (function(DEBUG){

    // Override console.log for debug & prod environments
    var preservedConsoleLog = console.log;
    console.log = function(){
        if(DEBUG) preservedConsoleLog.apply(console, arguments);
    };

    this.config = {
        DEBUG: DEBUG,
        name: "Alex",
        defaultMessage : "<p>Hey, how\'s it going? Just wanted to let you know that your profile "+
                         "is pretty awesome &ndash; very well written. Do you write in your spare time?<br /><br />"+this.name+"</p>"
    
    };

    return this;

})(DEBUG);
