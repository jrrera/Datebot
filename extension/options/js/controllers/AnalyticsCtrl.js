'use strict';

keywordsApp.controller('AnalyticsCtrl',
    function AnalyticsCtrl($scope, $timeout, $filter) {
        
        console.log('initiating AnalyticsCtrl!');

        /* 
        * This file starts with utility functions that will be used while
        * creating the scope and setting up the charts / data
        */

        //Utility function to calculate total response rate
        function getResponseRate(data, total) {
            var responseCount = 0;
            angular.forEach(data, function(interaction, key){
                if (interaction.response) responseCount++;
            });
            return (responseCount/total).toFixed(2);
        };

        //This function returns the earliest date based on the timestamp of each recorded interaction 
        function determineEarliestInt(data) {
            var earliestDate = new Date().getTime(),
                date;

            for (var key in data) {
                date = new Date(data[key].date_messaged).getTime();
                if (date < earliestDate) earliestDate = date;
            }
            return new Date(earliestDate).toDateString();
        }

        function getAveragePosition(positionArray) {
            var sum = 0,
                avg;
            
            for(var i = 0; i < positionArray.length; i++) {
                sum += positionArray[i];
            }

            return (avg = sum / positionArray.length).toFixed(1);
        }

        //Utility function to generate analytics by month
        function getInteractionsByMonth(data, total) {
            var month, 
                date,
                intsByMonth = {},
                monthNames = [ "January", "February", "March", "April", "May", "June",
                "July", "August", "September", "October", "November", "December" ];

            angular.forEach(data, function(interaction, key){
                date = new Date(data[key].date_messaged);
                month = monthNames[date.getMonth()];

                //Initialize an empty array if one doesn't exist yet on that key
                intsByMonth[month] = intsByMonth[month] || []; 
                intsByMonth[month].push(interaction);

            });

            // Run each month through getResponseRate() and attach the result
            angular.forEach(intsByMonth, function(month, key){
                month.responseRate = getResponseRate(month, month.length);              
            });

            console.log('intsByMonth', intsByMonth);
            return intsByMonth;
        };

        //Utility function to generate analytics by day of week
        function getInteractionsByDayOfWeek(data, total) {
            var dayOfWeek, 
                date,
                intsByDayOfWeek = {},
                dayOfWeekNames = [ "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", 
                    "Friday", "Saturday" ];

            angular.forEach(data, function(interaction, key){
                date = new Date(data[key].date_messaged);
                dayOfWeek = dayOfWeekNames[date.getDay()];

                //Initialize an empty array if one doesn't exist yet on that key
                intsByDayOfWeek[dayOfWeek] = intsByDayOfWeek[dayOfWeek] || []; 
                intsByDayOfWeek[dayOfWeek].push(interaction);

            });

            // Now, we run each month through the getResponseRate function
            // and attach the response rate
            angular.forEach(intsByDayOfWeek, function(day, key){
                day.responseRate = getResponseRate(day, day.length);              
            });

            console.log('intsByDayOfWeek', intsByDayOfWeek);
            return intsByDayOfWeek;
        };

        //Utility function to generate analytics by time of day message was sent
        function getInteractionsByTimeOfDay(data, total) {
            var timeOfDay, 
                date,
                intsByTimeOfDay = {};  

            angular.forEach(data, function(interaction, key){
                date = new Date(data[key].date_messaged);
                timeOfDay = date.getHours();

                //Initialize an empty array if one doesn't exist yet on that key
                intsByTimeOfDay[timeOfDay] = intsByTimeOfDay[timeOfDay] || []; 
                intsByTimeOfDay[timeOfDay].push(interaction);
            });

            // Now, we run each month through the getResponseRate function
            // and attach the response rate
            angular.forEach(intsByTimeOfDay, function(hour, key){
                hour.responseRate = getResponseRate(hour, hour.length);              
            });

            console.log('intsByTimeOfDay', intsByTimeOfDay);
            return intsByTimeOfDay;
        };

        //Utility function to generate analytics by keyword used, including avg position
        function getInteractionsByKeyword(data, total) {

            console.log('data', data);
            var keyword, 
                intsByKeyword = {};

            /* This code cycles through each interaction, extracts each of the keywords within
             * and builds an object containing arrays of interactions, and an avg position for
             * that keyword. Note: Interactions can appear in multiple places on this object
             */
            angular.forEach(data, function(interaction, key){
                angular.forEach(interaction.keywords, function (val, i) {
                    
                    // Some older interactions have the position as the value, and keyword as the 
                    // key / index, rather than vice versa. This if statement properly distinguishes 
                    // between the two by testing of the value is a number.

                    if (isNaN(parseInt(val))) {
                        keyword = val;    
                    } else {
                        keyword = i;
                    }
                    
                    // Initialize an empty array if one doesn't exist yet on that key
                    intsByKeyword[keyword] = intsByKeyword[keyword] || []; 
                    intsByKeyword[keyword].push(interaction);

                    // Creates an attribute on the keyword array to hold the position of said keyword
                    // This will be used to calculate average position of the keyword
                    intsByKeyword[keyword].positionArr = intsByKeyword[keyword].positionArr || [];
                    
                    if (isNaN(parseInt(val))) {
                        intsByKeyword[keyword].positionArr.push(i + 1); // Add +1 to normalize to 1-based index vs. 0-based
                    } else {
                        intsByKeyword[keyword].positionArr.push(parseInt(val)); // If using old data model, push the value without incrementing
                    }

                });
            });

            // Now, we run each month through the getResponseRate function
            // and attach the response rate
            angular.forEach(intsByKeyword, function(keyword, key){
                keyword.responseRate = getResponseRate(keyword, keyword.length);
                keyword.avgPosition = getAveragePosition(keyword.positionArr);
                delete keyword.positionArr; //Now that we have the full avg on a new property, remove the array             
            });

            console.log('intsByKeyword', intsByKeyword);
            return intsByKeyword;
        };

        function determineDaysElapsed(firstInteraction) {
            var thisTime = new Date(),
                originalTime = new Date(firstInteraction);

            var diff = thisTime.getTime() - originalTime.getTime();  
            return (diff / (1000*60*60*24));     // positive number of days
        }

        function buildGoogleCharts() {
            /* Compiles data on the scope for turning into a chart. Works in conjunction
             * with the directive found on ngGoogleCharts.js 
             */

            var dayOfWeekNames = [ "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", 
                "Friday", "Saturday", "Blargon" ];

            //Response rate by month, visualized      
            $scope.responseByMonthTable = {};
            $scope.responseByMonthTable.dataTable = new google.visualization.DataTable();
            $scope.responseByMonthTable.dataTable.addColumn("string","Month");
            $scope.responseByMonthTable.dataTable.addColumn("number","Response Rate");
            $scope.responseByMonthTable.title = "Response Rate by Month";

            angular.forEach($scope.dataByMonth, function(val, key) {
                $scope.responseByMonthTable.dataTable.addRow([key,parseFloat(val.responseRate)]);    
            });

            //Response rate by day of week, visualized
            $scope.responseByDayTable = {};
            $scope.responseByDayTable.dataTable = new google.visualization.DataTable();
            $scope.responseByDayTable.dataTable.addColumn("string","Day of Week");
            $scope.responseByDayTable.dataTable.addColumn("number","Response Rate");
            $scope.responseByDayTable.title = "Response Rate by Day Message was Sent";

            for(var i = 0; i < dayOfWeekNames.length; i++) {
                //If we have data on that day of the week, parse the response rate
                if ($scope.dataByDayOfWeek[dayOfWeekNames[i]]) {
                    $scope.responseByDayTable.dataTable.addRow([dayOfWeekNames[i], parseFloat($scope.dataByDayOfWeek[dayOfWeekNames[i]].responseRate)]);        
                }                
            }

            //Response rate by time of day, visualized
            $scope.responseByTimeTable = {};
            $scope.responseByTimeTable.dataTable = new google.visualization.DataTable();
            $scope.responseByTimeTable.dataTable.addColumn("string","Time of Day");
            $scope.responseByTimeTable.dataTable.addColumn("number","Response Rate");
            $scope.responseByTimeTable.title = "Response Rate by Time of Day Message was Sent";

            for(var i = 0; i < 25; i++) {
                if ($scope.dataByTimeOfDay[i]) {
                    $scope.responseByTimeTable.dataTable.addRow([i.toString(), parseFloat($scope.dataByTimeOfDay[i].responseRate)]);    
                }
            }

            //Response rate by keywords used, measured against avg position
            $scope.responseByKeywordTable = {};
            $scope.responseByKeywordTable.dataTable = new google.visualization.DataTable();
            $scope.responseByKeywordTable.dataTable.addColumn("string","Keyword");
            $scope.responseByKeywordTable.dataTable.addColumn("number","Response Rate");
            $scope.responseByKeywordTable.dataTable.addColumn("number","Avg Position in Message");
            $scope.responseByKeywordTable.title = "Response Rate by Top Keywords (Used 3+ times)";

            angular.forEach($scope.dataByKeyword, function(val, key){
                if (val.length > 2) {
                    console.log(key, 'was used', val.length, 'times');
                    $scope.responseByKeywordTable.dataTable.addRow([key, parseFloat(val.responseRate), parseFloat(val.avgPosition)]);
                }
            });
                
            console.log('Google charts constructed');
        }

        // Grab data from localStorage
        $scope.data = angular.fromJson(localStorage["dbotInteractions"]);
        
        // If we were able to pull the data
        if ($scope.data) {
            $scope.dataFound = true;

            //Calculate summary data
            $scope.dataLength = Object.keys($scope.data).length;
            $scope.responseRate = getResponseRate($scope.data, $scope.dataLength);
            $scope.earliestInteraction = determineEarliestInt($scope.data);
            $scope.daysSinceStarting = determineDaysElapsed($scope.earliestInteraction);
            $scope.ratePerWeek = (($scope.dataLength / $scope.daysSinceStarting) * 7).toFixed(0); //Rate of messages per week, rounded

            //Break out the data by month and day of week. Time of day coming soon!
            $scope.dataByMonth = getInteractionsByMonth($scope.data, $scope.dataLength);
            $scope.dataByDayOfWeek = getInteractionsByDayOfWeek($scope.data, $scope.dataLength);
            $scope.dataByKeyword = getInteractionsByKeyword($scope.data, $scope.dataLength);
            $scope.dataByTimeOfDay = getInteractionsByTimeOfDay($scope.data, $scope.dataLength);

            buildGoogleCharts(); //Now that data is compiled, put it in charts
        } else {
            $scope.dataFound = false;
        }



    }
); 