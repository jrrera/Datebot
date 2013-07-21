var casper = require('casper').create({
     clientScripts:  [
        'http://ajax.googleapis.com/ajax/libs/jquery/1.7.1/jquery.min.js'
     ]
});

casper.start(URL);

casper.then(function() {
    this.fill('form#logOnForm', {
        'uxAuthorityCode': '289',
        'uxUsername': 'Lichsystad',
        'uxPassword': PASSWORD
    }, false);
    this.click('input#uxSubmit');
});

casper.then(function() {
    this.click('#ctl00_PortalHeader_linkUpload');
});

casper.then(function() {
    this.fill('form#aspnetForm', {
        'ctl00$ContentPlaceholder$File1': '/tmp/lichfield.xml'
    }, false);
    this.click('input#ctl00_ContentPlaceholder_uploadButton');
    this.capture('login.png');
});

casper.then(function() {
    this.wait(5000, function() {
        if (this.visible('div[aria-labelledby="ui-dialog-title-dialogUploadContent"]')) {
            this.click('div[aria-labelledby="ui-dialog-title-dialogUploadContent"] .ui-state-default');
        } else {
            console.log('Error clicking the first confirmation box', 'error');
        }
    });
});

casper.then(function() {
    this.wait(5000, function() {
        if (this.visible('div[aria-labelledby="ui-dialog-title-dialogContent"]')) {
            this.click('div[aria-labelledby="ui-dialog-title-dialogContent"] .ui-state-default');
        } else {
            console.log('Error clicking the second confirmation box', 'error');
        }
    });
});

casper.then(function(){
    casper.page.injectJs('jquery-1.7.min.js');
    this.wait(5000, function() {
        this.capture('login.png');
        if (this.visible('span#ctl00_ContentPlaceholder_textBoxStatusMessages')) {
            console.log($('span#ctl00_ContentPlaceholder_textBoxStatusMessages').html(), 'info')
        } else {
            console.log('There was a problem', 'error');
            this.capture('login.png');
        }
    });
})

casper.run();
