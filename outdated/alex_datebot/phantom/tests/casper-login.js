/*
 * @desc:
 *
 *
 */

(function cspGetAuth(){

    var fs = require('fs'),
        sys = require('system'),
        utils = require('utils'),
        screenPath = fs.workingDirectory+'/screens/',
        paths = require(fs.workingDirectory+'/config/paths.json'),
        cspConfig = require(fs.workingDirectory+'/config/csp-config.json'),
        priv = require(fs.workingDirectory+'/config/private.json'),
        time = Date.now().toString();

        var casper = require('casper').create(cspConfig);

        var links = [];

        casper.on('remote.message', function(msg) {
            //this.echo('remote message caught: ' + msg);
        });

        casper.on("page.error", function(msg, trace) {
            //this.echo("Page Error: " + msg, "ERROR");
        });

        casper.start('http://www.okcupid.com/', function() {
            this.test.assertExists('form#sidebar_signin_form', 'form is found');
            this.fill('form#sidebar_signin_form', {
                'username':   priv.userName,
                'password':   priv.password
            }, true);
        });


        casper.then(function(){
            console.log(this.evaluate(function(){ return $('.answer_25_questions h2 a').text(); } ) );
            this.echo(this.getTitle(), "GREEN_BAR");
            if(this.exists('li#nav_matches')){
                this.echo("...and we're in!", "GREEN_BAR");
                this.echo(this.fetchText('h4'));

                links = this.evaluate(function(){ return $('#section_recent > ul.clearfix > li > a'); });
                this.each(links, function(self, link){
                    self.captureSelector('csp-testing-'+time+'.png', '#section_recent');
                    self.echo( $(link).attr('href') );
                });
                this.echo( this.evaluate(function(){ return $('#section_recent ul li a').first().attr('href'); }), 'INFO');

            }
            else this.echo("Hmmm couldn't find the matches nav, looks like we're not logged in", "ERROR");
        });


        casper.run(function() {
            this.exit();
        });

})();
