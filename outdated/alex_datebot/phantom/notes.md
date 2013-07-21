
PSEUDO-CODE
----------------------------------

_CRAWLER_
1)  Nightly cron wakes up main node thread
2)  Main node thread queries sqlite3 db for user's search criteria & prefs
3)  Main node thread creates casperjs/phantomjs child process
    * pipes child stdout to main stdin
    * passes in args: username/pass, url matching criteria

4)  Casper process pulls and uses cookies if they exist for user (local json file?) 
5)  Casper attempts auth with cookies, 
    * uses user/pass if not working
    * writes cookies to file after successful auth
6)  Casper pulls babe data (pic, url, username, kewords matched), injecting jquery where need-be  
7)  Casper stringifies babe data, and pipes to stdout (or writes JSON?)

8)  Main node thread captures babe data (or error) from child and writes to sqlite3

