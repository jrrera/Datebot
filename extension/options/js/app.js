'use strict';

// Declare app level module which depends on filters, and services. Sanitize prevnts XSS attacks, Resource is for RESTful ajax calls
var keywordsApp = angular.module('keywordsApp', []);

//Whitelist filesystem URLs for downloading
keywordsApp.config( [
    '$compileProvider',
    function( $compileProvider )
    {   
        $compileProvider.urlSanitizationWhitelist(/^\s*(https?|filesystem|ftp|blob|mailto|chrome-extension):/);
    }
]);