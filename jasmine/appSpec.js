describe('Controller Test Suite', function(){

  describe('ProfileController', function() {
    var $scope, ctrl, mockScraperDataService, timeout;
    
    //you need to indicate your module in a test
    beforeEach(module('dbotExtApp'));

    //This is where we're setting up the $scope and calling the controller function on it, injecting...
    beforeEach(inject(function($rootScope, $controller, $timeout, $q) {
      
      //Create a scope object for us to use that will be populated with real $scope data shortly.
      $scope = $rootScope.$new();
      timeout = $timeout; //This allows us to access timeout globally. In particular, we need it inside of the 'it' statements. 

      //Mocked version of the ScraperData service. Needs to access the $q service, so I placed it in the beforeEach
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
                  deferred.resolve(defaultKeywords);
              }, 500);
              
              return deferred.promise;
          },
          getProfile: function($scope) {
              var html = "<html>hi!</html>",
                  deferred = $q.defer(); //$q service uses async promises so you're not nesting callbacks on callbacks on callbacks

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

    it('should call getKeywords() once without error', function (){
        spyOn(mockScraperDataService, 'getKeywords')
        mockScraperDataService.getKeywords();
        timeout.flush();

        expect(mockScraperDataService.getKeywords).toHaveBeenCalled();        
        expect(mockScraperDataService.getKeywords.callCount).toEqual(1);
    });

    it('should have a keywords object on $scope.keywords', function() {
        mockScraperDataService.getKeywords();
        timeout.flush();

        expect($scope.keywords).toEqual(jasmine.any(Object));
        expect($scope.keywords.pairs).toEqual(jasmine.any(Array));
    });

  });

});

describe('Filter Test Suite', function(){
    beforeEach(module('dbotExtApp'));

    describe('replaceLineBreaks', function(){
        var replaceLineBreaks, string, replacedString;

        beforeEach(inject(function($filter) {
            replaceLineBreaks = $filter('replaceLineBreaks');
        }));

        it('should remove line breaks with <br /> tags', function(){
            string = "Hello, Jon!\n\nThis is a message I need you to decode.\n\nCheers,\nMichael";
            replacedString = "Hello, Jon!<br /><br />This is a message I need you to decode.<br /><br />Cheers,<br />Michael";
      
            expect(replaceLineBreaks(string)).toEqual(replacedString);
        });
    });
});



