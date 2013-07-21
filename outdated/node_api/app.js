
/**
 * Module dependencies.
 */

var express = require('express')
  , routes = require('./routes')
  , user = require('./routes/user')
  , http = require('http')
  , path = require('path')
  , cradle = require('cradle')
  , conn = new(cradle.Connection)();

var db = conn.database('dbot');

checkExist(db);



function checkExist(db, request, object){
  db.exists(function (err, exists) {
    if (err) {
      console.log('error', err);
    } else if (exists) {
      console.log('Database exists: the force is with you.');

      //Begin action
      if (request === "newint") {
        console.log(object);
        var result = queryRecord(db, object.username, object);        
      }

      if (request === "keywords") {
        db.save('1350a431132afbbdbbf39cb475007699', {
            keyword_list: object
        }, function (err, res) {
            if (err) {
              console.log("Error in saving the keyword list: ", err);
            } else {
              console.log(res);
            }
        });        
      }

    } else {
      console.log('database does not exist. :(');
      //Consider a db.create()?
      /* populate design documents */
    }
  });
}

  function queryRecord(db, user, interaction) {
  db.view('users/users', { key: user }, function (err, doc) {
      if (err) {
        console.log("oops! error finding that user! ", err);
      } else {
        console.log("Queried the view for ", user, ". The result: ",doc);
        if (doc[0] != undefined) {
          
          console.log("We found a match! No additional record created");
          //Update the record

        } else {

          console.log("There was no match for that user");
          //Insert new record
          newRecord (db, interaction);
        }
      }
  });
}


function newRecord(db, interaction) {
  var i = interaction;
  db.save({
      username: i.username,
      date_messaged: i.date_messaged,
      keywords: i.keywords,
      response: false,
      customized: i.customized,
      opener: i.opener,
      closer: i.closer
  }, function (err, res) {
      // Handle response
      if (err) {
        console.log("We had an error saving the new record: ", err);
      } else {
        console.log("Processed newRecord request. Result:", res);
      }
  });
}

  //var info = "";
  //db.view('contact_details2/Contact Details2', function (err, res) {
  //  info = res;
  //  console.log(info);
  //});


//--------------
//Begin express 

var app = express();

// all environments
app.set('port', process.env.PORT || 3000);
//app.set('views', __dirname + '/views');
//app.set('view engine', 'ejs');
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.bodyParser());
app.use(express.methodOverride());
app.use(express.cookieParser('your secret here'));
app.use(express.session());
//app.use(app.router);
//  app.use(require('stylus').middleware(__dirname + '/public'));

//This is the core of this right now
app.use(express.static(path.join(__dirname, 'app')));

// development only
if ('development' == app.get('env')) {
  app.use(express.errorHandler());
}

//app.get('/', routes.index);
//app.get('/users', user.list);
app.get('/update/:name', function(req, res){
	console.log(req.query);
	res.send(info);
});

app.post('/messages', function(req, res){
	console.log("This was a test");
	console.log(req.body.names);
  var messages = req.body.names;

  checkExist(db, "messages", messages);
	
  res.end("Completed!");

});

app.post('/newint', function(request, response){
    var babeObj = request.body.interaction;
    console.log(babeObj.interaction);
    checkExist(db, "newint", babeObj);
    response.end('Success!');
});

app.post('/data', function(request, response){
  db.view('users/users', function (err, doc) {
    if (err) {
      console.log("oops! error! ", err);
    } else {
      var result = JSON.stringify(doc, null, "  ");
      console.log(result);
      response.end(result);
    }
  });
});

app.post('/keywords', function(request, response){
    var keywordObj = request.body.keywords;
    console.log(keywordObj);
    checkExist(db, "keywords", keywordObj);
    response.end("Got the keywords. Thanks!");
});

http.createServer(app).listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});