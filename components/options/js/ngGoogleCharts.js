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

            //If it's just one axis and we see percent as format, convert the vAxis options to %
            if($attr.format === "percent" && !$attr.dualY) {
                options.vAxis = {
                    format:'#%',
                    maxValue: ($attr.max || 1),
                    minValue: ($attr.min || 0)
                };
            }

            //If we have two Y axes, use this logic instead
            if($attr.dualY) {
                options.series = {
                    0:{targetAxisIndex:0},
                    1:{targetAxisIndex:1}
                }

                if ($attr.format === 'percent') {
                    options.vAxes = {
                        0: {logScale: false, format: '#%', maxValue: ($attr.max || 1)},
                        1: {logScale: false, maxValue: ($attr.max2 || 1)}
                    }
                } else {
                    options.vAxes = {
                        0: {logScale: false, maxValue: ($attr.max || 1)},
                        1: {logScale: false, maxValue: ($attr.max2 || 1)}
                    }
                }
            }

            var googleChart = new google.visualization[$attr.googleChart]($elem[0]);
            googleChart.draw(data,options)
        }
    }
});