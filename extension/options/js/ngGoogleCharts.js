"use strict";
 
var googleChart = googleChart || angular.module("google-chart",[]);
 
googleChart.directive("googleChart",function(){
    return{
        restrict : "A",
        link: function($scope, $elem, $attr){
            var data = $scope[$attr.ngModel].dataTable,
                options = {};
            
            if($scope[$attr.ngModel].title) {
                options.title = $scope[$attr.ngModel].title;
            }

            if($attr.format === "percent") {
                options.vAxis = {
                    format:'#%',
                    maxValue: ($attr.max || 1),
                    minValue: ($attr.min || 0)
                };
            }

            var googleChart = new google.visualization[$attr.googleChart]($elem[0]);
            googleChart.draw(data,options)
        }
    }
});