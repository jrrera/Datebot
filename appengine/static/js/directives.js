'use strict';

//TEST
scraperApp.direction('popularitycheck', function(scope, elem){
	return {
		restrict: 'A',
		link: function() {
			if (popular) {
				return elem.innerHTML.toUpperCase();
			}
		}
	}
});

//TEST, DOESNT WORK
scraperApp.directive('darthFader', function() {
  return {
    restrict: 'A',
    link: function($scope, element, attrs) {
      var duration = attrs.fadeDuration || 6000;
      $scope.$watch(attrs.fadeShown, function(value) {
        if (value)
          $(element).fadeIn(duration);
        else
          $(element).fadeOut(duration);
      });
     }
   };
});