'use strict';

// Using this guide for Google Charts with AngularJS: 
// http://gavindraper.com/2013/07/30/google-charts-in-angularjs/

/*We need to manually start angular as we need to
wait for the google charting libs to be ready*/
google.setOnLoadCallback(function () {    
    angular.bootstrap(document.body, ['keywordsApp']);
});

google.load('visualization', '1', {packages: ['corechart']});

// Declare app level module, with routing and google charts as module dependencies
var keywordsApp = keywordsApp || angular.module('keywordsApp', ['ngRoute', 'google-chart']);

//Whitelist filesystem URLs for exporting data
keywordsApp.config(['$compileProvider',
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

