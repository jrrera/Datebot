var fs = require('fs'),
	async = require('async');

var sqlite3 = require('sqlite3').verbose();
var db = new sqlite3.Database('datebot-dev');


// Test for connectivity by returning first row
db.get('SELECT * from USER', function(err, firstRow){
    if(firstRow) console.log('SUCCESS: ', firstRow);
    else console.log('ERROR: ', err);
});
