'use strict';

// Declare app level module which depends on filters, and services. Sanitize prevnts XSS attacks, Resource is for RESTful ajax calls
var keywordsApp = angular.module('keywordsApp', ['ngRoute']);

//Whitelist filesystem URLs for downloading
keywordsApp.config( [
    '$compileProvider',
    function( $compileProvider ) {   
        $compileProvider.aHrefSanitizationWhitelist(/^\s*(https?|filesystem|ftp|blob|mailto|chrome-extension):/);
    }
]);

//Set up routes
keywordsApp.config(function($routeProvider) {
  $routeProvider.when('/', {
    templateUrl: 'partials/keywords.html',
    controller: "KeywordController"
  }).
  when('/analytics', {
    templateUrl: 'partials/analytics.html',
    controller: "AnalyticsCtrl"
  }).
  otherwise({
    redirectTo: "/"
  });
});