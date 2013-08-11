'use strict';

keywordsApp.controller('KeywordController', 
	function KeywordController($scope, keywordData) {
		$scope.keyword = keywordData.keywords;
		
		//Uncomment this section once ready to integrate into Chrome extension
		//$scope.keyword = keywordData.keywordsAjax();

		$scope.sortorder = 'keyword';
	}
);