'use strict';

// Declare app level module which depends on filters, and services. Sanitize prevnts XSS attacks, Resource is for RESTful ajax calls
var keywordsApp = angular.module('keywordsApp', ['ngResource']);


// //See this StackOverflow post for why this is here: 
// //http://stackoverflow.com/questions/16661032/http-get-is-not-allowed-by-access-control-allow-origin-but-ajax-is
// keywordsApp
//   .config(function($httpProvider){
//     delete $httpProvider.defaults.headers.common['X-Requested-With'];
// });