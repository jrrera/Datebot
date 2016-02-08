'use strict';

angular.module('datebot').directive('copyToClipboard', function(TextProcessorService) {
    return {
      restrict: 'A',
      scope: {
        onCopy: '&',
        customOverride: '='
      },
      link: function(scope, elem, attrs) {
        document.addEventListener('copy', function(e) {
          var message = (scope.customOverride ||
              TextProcessorService.processLineBreaks(elem.html()));
          console.log(message);
          e.clipboardData.setData('text/plain', message);
          e.preventDefault();

          scope.onCopy();
  			});
      }
    }
});
