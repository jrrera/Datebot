var fs = require('fs'),
	async = require('async');

var sqlite3 = require('sqlite3').verbose();
var db = new sqlite3.Database('../db/datebot-dev');

var dummyData = require('./dummy-data.json');

async.series([
    function(cb1){
        async.eachSeries(dummyData.user, function(val, callback){
            db.run("INSERT INTO user(username, name) VALUES (?, ?)", val.username, val.name, function(err){
                if(err) console.log(err);
                else callback();
            });
        });
        cb1(null, 'Successfully inserted users');
    },
    function(cb1){
        async.eachSeries(dummyData.babe, function(val, callback){
            db.run("INSERT INTO babe(cupid_id, age, location, page_url, pic_url) VALUES (?, ?, ?, ?, ?)", val.cupid_id, val.age, val.location, val.page_url, val.pic_url, function(err){
                if(err) console.log(err);
                else callback();
            });
        });
        cb1(null, 'Successfully inserted babes');
    },
    function(cb1){
        async.eachSeries(dummyData.match, function(val, callback){
            db.run("INSERT INTO match(user_id, babe_id, ignored_bool, messaged_bool, success_bool, date_matched) VALUES (?, ?, ?, ?, ?, ?)",
                val.user_id, val.babe_id, val.ignored_bool, val.messaged_bool, val.success_bool, val.date_matched, function(err){
                if(err) console.log(err);
                else callback();
            });
        });
        cb1(null, 'Successfully inserted matches');
    },
    function(cb1){
        async.eachSeries(dummyData.user_keywords, function(val, callback){
            db.run("INSERT INTO user_keywords(user_id, name, priority, message) VALUES (?, ?, ?, ?)", val.user_id, val.name, val.priority, val.message, function(err){
                if(err) console.log(err);
                else callback();
            });
        });
        cb1(null, 'Successfully inserted keywords');
    },
    function(cb1){
        async.eachSeries(dummyData.matched_keywords, function(val, callback){
            db.run("INSERT INTO matched_keywords(match_id, keyword_id, context) VALUES (?, ?, ?)", val.match_id, val.keyword_id, val.context, function(err){
                if(err) console.log(err);
                else callback();
            });
        });
        cb1(null, 'Successfully inserted matched keywords');
    }
],
function(err, res){
    console.log('Populated data with err: ', err, ' and results: ', res.toString());
});

