describe('Testing the Profile controller', function() {
  var $scope, ctrl, mockService, timeout;
  
  //you need to indicate your module in a test
  beforeEach(module('dbotExtApp'));

  // IMPORTANT! this is where we're setting up the $scope and calling the controller function on it, injecting...
  // all the important bits, like our mockService
  beforeEach(inject(function($rootScope, $controller, $timeout, $q, ScraperData) {
    
    //create a scope object for us to use that will be populated with real $scope data shortly.
    $scope = $rootScope.$new();
    timeout = $timeout;

    //Mocked version of the ScraperData service. Needs to access the $q service
    mockScraperDataService = {
        getKeywords: function() {
            var deferred = $q.defer();
            var defaultKeywords = {
                "opener":"Hey, how's it going?\n\n", 
                "closer":"Cheers,\n{Name}",
                "first_transition" : "Also,",
                "second_transition" : "Oh, and", 
                "pairs": [
                    {
                        "keyword": "cooking",
                        "message": "I'm really into cooking too. Do you have a specialty dish? Mine's {{INSERT DISH NAME HERE}}.",
                        "priority": 2
                    },
                    {
                        "keyword": "travel",
                        "message": "How was traveling in {{COUNTRY/STATE/PLACE}}? I've been to {{COUNTRY/STATE/PLACE}} and had an amazing time.",
                        "priority": 2
                    }
                ]
            };
            $timeout(function(){
                console.log('Returning JSON!');
                deferred.resolve(defaultKeywords);
            }, 500);
            
            return deferred.promise;
        },
        getProfile: function($scope) {
            console.log('Initalizing profile grab...');

            var html = "<html>hi!</html>";
            var deferred = $q.defer(); //$q service uses async promises so you're not nesting callbacks on callbacks on callbacks


            $timeout(function(){
                console.log('returning a profile!');
                deferred.resolve({html:html});
            }, 100);

            return deferred.promise;
        }
    };

    //now run that scope through the controller function, injecting any services or other injectables we need.
    ctrl = $controller('ProfileController', {
      ScraperData: mockScraperDataService,
      $scope: $scope,
      $timeout: $timeout
    });
  }));

  it('should initiate with a generic question based on day of week', function() {
    var dayOfWeek = new Date().getDay();
    
    if (dayOfWeek === 6 || dayOfWeek === 0) {
        expect($scope.genericQuestion).toEqual("How's your weekend going?");    
    } else {
        expect($scope.genericQuestion).toEqual("How's your week going?");    
    }
    
  });
  

  it('should return a keywords object on $scope.keywords when initiate() function is called', function (){
      $scope.initialize();
      timeout.flush();
      expect($scope.keywords).toEqual(jasmine.any(Object));    
  });
  
  /* Test 4b: Probably should test that the service method was
   * called as well. We'll use Jasmine's spyOn() method to do
   * this. */
  // it('should make a call to someService.someAsyncCall() in test()', function (){
  //   //set up the spy.
  //   spyOn(mockService, 'someAsyncCall').andCallThrough();
    
  //   //make the call!
  //   $scope.test2();
    
  //   //assert!
  //   expect(mockService.someAsyncCall).toHaveBeenCalled();    
  // });
});