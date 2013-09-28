//This service allows non-angular scripts to access the Angular world through the $window.addSuccess
//See here: http://stackoverflow.com/questions/14945177/angularjs-passing-variables-into-controller

scraperApp.factory('SuccessReceiver', function($window) {
  var successUsers = [];
  var scopes = [];

  $window.addSuccess = function(user) {
    console.log("Within addSuccess function, user is:", user);
    successUsers.push(user);
    angular.forEach(scopes, function(scope) {
        scope.$digest();
    });

    console.log('successUsers array:', successUsers);
    
    //I would also push this to the server as a success from this service.
  };

  return {
    users: successUsers,
    register: function(scope) { scopes.push(scope); }
  };
});