'use strict';

keywordsApp.controller('AnalyticsCtrl',
    function AnalyticsCtrl($scope, $timeout, $filter) {
        
        console.log('initiating AnalyticsCtrl!');

        /* 
        * This file opens with utility functions that will be used while
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
                "Friday", "Saturday" ];

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
                $scope.responseByDayTable.dataTable.addRow([dayOfWeekNames[i], parseFloat($scope.dataByDayOfWeek[dayOfWeekNames[i]].responseRate)]);    
            }
        }


        //Grab data from localStorage
        $scope.data = angular.fromJson(localStorage["dbotInteractions"]);
        
        //Calculate summary data
        $scope.dataLength = Object.keys($scope.data).length;
        $scope.responseRate = getResponseRate($scope.data, $scope.dataLength);
        $scope.earliestInteraction = determineEarliestInt($scope.data);
        $scope.daysSinceStarting = determineDaysElapsed($scope.earliestInteraction);
        $scope.ratePerWeek = (($scope.dataLength / $scope.daysSinceStarting) * 7).toFixed(0); //Rate of messages per week, rounded

        //Break out the data by month and day of week. Time of day coming soon!
        $scope.dataByMonth = getInteractionsByMonth($scope.data, $scope.dataLength);
        $scope.dataByDayOfWeek = getInteractionsByDayOfWeek($scope.data, $scope.dataLength);

        buildGoogleCharts(); //Now that data is compiled, put it in charts


    }
); 