/*
 * @desc:  app globals, constants, config
 * @created:  09-02-2013
*/


// Set DEBUG constant for logging
if(typeof DEBUG === 'undefined') var DEBUG = true;


(function(window, document, DEBUG, chrome){

    var DateBot = DateBot || {};

    // Override console.log for debug & prod environments
    var preservedConsoleLog = console.log;
    console.log = function(){
        if(DEBUG) preservedConsoleLog.apply(console, arguments);
    };

})();
