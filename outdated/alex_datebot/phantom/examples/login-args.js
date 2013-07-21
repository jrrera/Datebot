var system = require('system');

if (system.args.length < 5) {
  console.info("You need to pass in account name, username, password, and path to casperJS as arguments to this code.");
  phantom.exit();
}

var account = system.args[1];
var username = system.args[2];
var password = system.args[3];
var base_uri = "https://example.com/" + account;
phantom.casperPath = system.args[4];

phantom.injectJs(phantom.casperPath + '/bin/bootstrap.js');

var utils = require('utils');

var casper = require('casper').create({
  verbose: true,
  logLevel: 'debug'
});

casper.on('error', function(msg,backtrace) {
  this.echo("=========================");
  this.echo("ERROR:");
  this.echo(msg);
  this.echo(backtrace);
  this.echo("=========================");
});

casper.on("page.error", function(msg, backtrace) {
  this.echo("=========================");
  this.echo("PAGE.ERROR:");
  this.echo(msg);
  this.echo(backtrace);
  this.echo("=========================");
});

casper.start(base_uri + "/login", function () {
  this.fill("form[name='login_form']", { username: username, password: password },true);
});

// can't click the reports button as that causes a weird file:// link problem
casper.thenOpen(base_uri + "reports");

casper.then(function() {
  var url = this.evaluate(function() {
    return __utils__.getElementByXPath("//a[contains(@href,'Account') and contains(@href,'Report')]").href;
  });

  // winOpenTransform is a function provided by the page; it's brittle for us to invoke it
  // this way instead of clicking a button, but when you click the button, it pops up a new
  // window, and PhantomJS doesn't currently support popup windows. Thus I have to call
  // this function directly to avoid a popup.
  url = winOpenTransform(url.match(/http:.+?(?=')/)[0]);
  this.open(url);
});

casper.then(function() {
  casper.page.injectJs('jquery.min.js'); // so we can pick an option with the select item below
});

casper.thenEvaluate(function() {
  document.report.runtimeCondition.value = "ExampleField IS NOT NULL";
  document.report.condition.value = "'','','examplename IS NOT NULL','21'";
  document.report.target = "report";
  document.report.submit();
});

casper.thenOpen("https://example.com/" + account + "/Report/reports");

casper.then(function() {
  var url = this.evaluate(function() {
    return __utils__.getElementByXPath("//a[./text()='CSV']")["href"];
  });

  this.echo("GETTING " + url);
  this.download(url,"data.csv","GET");
});

casper.run();
