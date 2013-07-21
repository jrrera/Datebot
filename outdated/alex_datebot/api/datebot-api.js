/*
 * @desc:
 */

var http = require('http'),
    fs = require('fs'),
	async = require('async'),
    config = require('../config/server-settings.json'),
    express = require('express');
var app = express();
var sqlite3 = require('sqlite3').verbose();
var db = new sqlite3.Database('../db/datebot-dev');


app.get('/user', function(req, res){
    db.all('SELECT * FROM user', function(err, rows){
        if(rows.length){
            console.log(rows);
            res.send(rows);
        } else {    // error thrown
            throw err;
        }
    });
});



app.get('/user/:key', function(req, res){
    if(IsNumeric(req.params.key)){   // assume it's an id
        db.get('SELECT * FROM user WHERE id = ?', req.params.key, function(err, row){
            if(row){
                console.log(row);
                res.send(row);
            } else {    // error thrown
                throw err;
            }
        });
    } else {        // assume its a username
        db.get('SELECT * FROM user WHERE username = ?', req.params.key, function(err, row){
            if(row){
                console.log(row);
                res.send(row);
            } else {    // error thrown
                throw err;
            }
        });
    }
});


app.get('/babe', function(req, res){
    db.all('SELECT * FROM babe', function(err, rows){
        if(rows.length){
            console.log(rows);
            res.send(rows);
        } else {    // error thrown
            throw err;
        }
    });
});


app.get('/babe/:key', function(req, res){
    if(IsNumeric(req.params.key)){   // assume it's an id
        db.get('SELECT * FROM babe WHERE id = ?', req.params.key, function(err, row){
            if(row){
                console.log(row);
                res.send(row);
            } else {    // error thrown
                throw err;
            }
        });
    } else {        // assume its a username
        db.get('SELECT * FROM babe WHERE cupid_id = ?', req.params.key, function(err, row){
            if(row){
                console.log(row);
                res.send(row);
            } else {    // error thrown
                throw err;
            }
        });
    }
});

/*
 * @desc: update the user default message
 * @param:
 */


app.set('port', process.env.PORT || config.port);       // 3000?

http.createServer(app).listen(app.get('port'), function(){
    console.log("Express server listening on port " + app.get('port'));
});
