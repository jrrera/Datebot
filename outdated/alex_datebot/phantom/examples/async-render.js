casper.start('https://twitter.com/casperjs_org', function() {
    this.waitForSelector('.tweet-row', function() {
        this.captureSelector('twitter.png', 'html');
    }, function() {
        this.die('Timeout reached. Fail whale?').exit();
    }, 2000);
});
