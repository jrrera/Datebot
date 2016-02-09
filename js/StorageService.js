'use strict';

angular.module('datebot').factory(function() {
  function recordInteraction(interactionObj) {
    var records = localStorage["dbotInteractions"], //storage object containing username as key and interaction as value
        user = interactionObj.username;

    if (records) {
      records = JSON.parse(records);
      // We assume one interaction per user using Datebot. The second, third
      // interaction, etc. should come directly from you! :)
      if (!records[user]) records[user] = interactionObj;
    } else {
      console.log('No interaction record found, adding...');
      records = {};
      records[user] = interactionObj;
    }
    localStorage["dbotInteractions"] = JSON.stringify(records);
    //console.log(JSON.stringify(records, null, 4));
  }

  return {
    recordInteraction: recordInteraction
  };
});
