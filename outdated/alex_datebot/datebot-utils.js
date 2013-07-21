(function(){
    var Datebot = Datebot || { utils : {} };

    // Global queryString function for all models and collections
    Datebot.utils.queryString = function(arr) {
        var qryStr = '?';
        for(var i = 0; i < this.arr.length; i++){
            qryStr += this.arr[i] + '&';
        }
        return qryStr.slice(-1);
    };

    Datebot.utils.timeToSeconds = function(timeStr){
        if(timeStr.toFixed()) return timeStr;       // If actually an int, assume it is # of seconds and return it
        else {
            switch(timeStr){
                case 'day': return 60*60*24;
                case 'week': return 60*60*24*7;
                case 'month': return 60*60*24*7*30;
                case 'year': return 60*60*24*365;
                default : return false;
            }
        }
    };

    Datebot.utils.getQueryParam = function(name, queryStr){
        name = name.replace(/[\[]/, "\\\[").replace(/[\]]/, "\\\]");
        var regexS = "[\\?&]" + name + "=([^&#]*)";
        var regex = new RegExp(regexS);
        var results = regex.exec(queryStr || window.location.search);
        if(results === null)
            return "";
        else
           return decodeURIComponent(results[1].replace(/\+/g, " "));
    };

    Datebot.utils.readCookie= function(name){
        var nameEQ = name + "=";
        var ca = document.cookie.split(';');
        for(var i=0;i < ca.length;i++){
            var c = ca[i];
            while (c.charAt(0)==' '){
                c = c.substring(1,c.length);
            }

            if (c.indexOf(nameEQ) === 0){
                return c.substring(nameEQ.length,c.length);
            }
        }
        return null;
    };

    Datebot.utils.createCookie=function (name,value,days){
        var expires;
        if (days){
            var date = new Date();
            date.setTime(date.getTime()+(days*24*60*60*1000));
            expires = "; expires="+date.toGMTString();
        }
        else {
            expires = "";
        }

        document.cookie = name+"="+value+expires+"; path=/";
    };

    Datebot.utils.jsonResponse= function(code){
        jsonCodes = [],
        jsonCodes[400] = 'Unrecognized command',
        jsonCodes[401] = 'Permission denied',
        jsonCodes[402] = 'Missing argument',
        jsonCodes[401] = 'Incorrect password',
        jsonCodes[404] = 'Account not found',
        jsonCodes[405] = 'Email not validated',
        jsonCodes[408] = 'Token expired',
        jsonCodes[411] = 'Insufficient privileges',
        jsonCodes[500] = 'Internal server error';
        return jsonCodes[code];
    };
})();
