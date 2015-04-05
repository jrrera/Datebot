/**
 * @constructor
 * @ngInject
 */ 
function MatchService() {}

angular.module('datebot').service(
    'MatchService', MatchService);


/**
 * Calculates match score based on frequency and priority of mutual interests.
 * A priority of 1 equates to 5 points; priority of 2 = 3 points; 
 * priority of 1 = 1 point. A score of 5 or higher is a winner.
 *
 * @param {Object} profile Profile object to analyze.
 * @return {number} score 
 */ 
MatchService.prototype.calculateMatchScore = function(profile) {
  var score = 0;

  if (profile) {  
    angular.forEach(profile.matchData.matched, function(keyword, i){
      if (keyword.priority === "1") {
        score += 5;
      } else if (keyword.priority === "2") {
        score += 3;
      } else if (keyword.priority === "3") {
        score += 1;
      } else { //If no priority has been assigned, or it's the wrong data type, we give it a score of 1.
        score += 1;
      }       
    });
  }

  return score;
};


/**
 * Returns a verbal recommendation of current profile.
 *
 * @param {number} score Compatibility score
 * @return {string} recommendation
 */ 
MatchService.prototype.getRecommendation = function(score) {
  if (score > 10) {
    return "Damn. She's a winner!";
  } else if (score > 4) {
    return "A good match!";
  } else {
    return 'Meh.';
  }
};

