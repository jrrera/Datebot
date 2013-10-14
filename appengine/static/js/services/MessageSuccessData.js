//This service allows non-angular scripts to access the Angular world through the $window.addSuccess
//See here: http://stackoverflow.com/questions/14945177/angularjs-passing-variables-into-controller

scraperApp.factory('SuccessReceiver', function($http, $log, $window) {
  var successUsers = [];
  var scopes = [];

  $window.addSuccess = function(user) {

    //Add user to model
    successUsers.push(user);
    console.log('successUsers array:', successUsers);
    console.log('scopes array:', scopes);

    angular.forEach(scopes, function(scope) {
        scope.$digest();
    });

    //Post update to the server
    $http({method: 'POST', url:'http://localhost:8080/update?profile=' + user}).
      success(function (data, status, headers, config){
        $log.info('Success!');
      }).
      error(function (data, status, headers, config) {
        $log.warn(status, headers);
      });
  };

  return {
    users: successUsers,
    register: function(scope) { scopes.push(scope); }
  };
});

