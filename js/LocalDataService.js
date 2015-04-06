/**
 * @constructor
 * @ngInject
 */ 
function LocalDataService() {}

angular.module('datebot').service(
    'LocalDataService', LocalDataService);


/**
 * Parses profile meta data to store key data points in local storage.
 * TODO(jon): Factor out the data processing for the act of saving locally.
 *
 * @param {Object} profileData Profile object to analyze.
 */ 
LocalDataService.prototype.recordInteraction = function(profileData) {
  var records = localStorage.getItem('dbotInteractions');
  var keywordsList = profileData.matchData.matched
      .filter(function(matchEntry) {
        return matchEntry.checked;  // Only include keywords included in msg.
      })
      .map(function(matchEntry){
        return matchEntry.keyword;
      });

  if (!records) {
    records = {};
  } else {
    records = JSON.parse(records);
  }

  records[profileData.okcUsername] = {
    keywords: keywordsList || 'genericQuestion',
    username: profileData.okcUsername,
    date_messaged: new Date(),
    customized: profileData.matchData.customized,
    response: false,
    opener: profileData.matchData.opener.replace(/(?:\n|<br\s?\/?>)/gi, ""), //Removes line breaks and br tags from record
    closer: profileData.matchData.closer.replace(/(<br\s?\/?>)/gi, "\n"),
    matchScore: profileData.matchScore
  };

  console.log('Data we are saving', records[profileData.okcUsername]);
  localStorage.setItem('dbotInteractions', JSON.stringify(records));
};


/**
 * Checks if we have any locally cached data for this profile.
 * Necessary when you leave the app for a minute to read the profile and then
 * reload it to send a message. (i.e. restores your work.)
 *
 * @param {string} username
 * @return {boolean} localDataFound
 */ 
LocalDataService.prototype.cachedUserDataFound = function(username) {
  return (localStorage["dbotCustomUser"] === username && 
          localStorage["dbotCustomMessage"]);
};


/**
 * Returns locally cached message text for custom messages / unsaved work.
 *
 * @return {string} customMessage
 */ 
LocalDataService.prototype.getSavedMessage = function(username) {
  return localStorage.getItem('dbotCustomMessage');
};


/**
 * Wipes out all custom cached message data locally.
 */ 
LocalDataService.prototype.clearCustomMessageData = function() {
  localStorage["dbotCustomMessage"] = null;
  localStorage["dbotCustomUser"] = null;
};


/**
 * Saves custom message data locally.
 *
 * @param {string} username
 * @param {string} msg The custom message to save.
 */ 
LocalDataService.prototype.saveCustomMessageData = function(username, msg) {
  localStorage["dbotCustomUser"] = username;
  localStorage["dbotCustomMessage"] = msg;
};


/**
 * Opens up your local options page.
 */ 
LocalDataService.prototype.openChromeExtensionOptions = function() {
  var extId = chrome.i18n.getMessage("@@extension_id"); 
  chrome.tabs.create({ 
      url: "chrome-extension://" + extId + "/components/options/interests.html",
      active: true
  });
};



