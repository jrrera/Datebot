/*
 * @desc: script for interaction with underlying okc page  
 * @created:
*/

$(function(){

    chrome.extension.onMessage.addListener(function (msg, sender, sendResponse) {

        var removeProfileFluff = function(text){ 
          //This function removes the built-in OKC text headers, changes problematic double quotation marks to singles, and removes unnecessary spacing. 
          var replace1 = "my self-summary";
          var replace2 = "what i\u2019m doing with my life";
          var replace3 = "the first things people usually notice about me";
          var replace4 = "favorite books, movies, shows, music, and food";
          var replace5 = "the six things i could never do without";
          var replace6 = "i spend a lot of time thinking about";
          var replace7 = "on a typical friday night i am";
          var replace8 = "the most private thing i\u2019m willing to admit";
          var replace9 = "i\u2019m looking for";
          var replace10 = new RegExp('"', "g");
          var replace11 = "            ";

          var findreplace = [replace1,replace2,replace3,replace4,replace5,replace6,replace7,replace8,replace9,replace11];
          
          var textUpdate = text;
          for (var i = 0; i < findreplace.length; i++) {
            textUpdate = textUpdate.replace(findreplace[i],"");
          }
            textUpdate = textUpdate.replace(replace10, "'");

          return textUpdate;
        };

        var processContext = function(){
            var contextArr = [];
            var name, essay, finalEssay;
            for (var i = 0; i < 9; i++) {
                var contextObj = {};
                name = $('#essay_'+i+'> a').text();
                essay = $('#essay_text_'+i).text();

                finalEssay = essay.replace(/\n/gi," ");

                contextObj.name = name;
                contextObj.essay = finalEssay;

                contextArr.push(contextObj);
                console.log(contextObj);
            }

            return contextArr;
        };

        //Upon receiving a scrape command from the bg script, this will scrape the page, remove line breaks & unnecessary spaces, and send back as 'summary'
        if (msg.action == "scrape") {
            console.log("The content_script has been injected!");

            var okcText = $("#main_column").text().toLowerCase();
            var okcUserName = $('#basic_info_sn').text();
            var okcPicture = $('#thumb0 img').attr('src');

            var okcContext = processContext();
            //console.log("okcText when run through process Context function", experiment);


            //console.log("okcText before processing fluff out", okcText);
            okcText = removeProfileFluff(okcText);
            
            //var okcContext = okcText.replace(/(\r\n|\n|\r)/gm," / ");
            //okcContext = okcContext.replace(/\s+/gm, " ");
            
            okcText = okcText.replace(/(\r\n|\n|\r)/gm," ");
            okcText = okcText.replace(/\s+/gm, " ");
            

            var summary = [okcText, okcUserName, okcPicture, okcContext];
            sendResponse("scraped");

            console.log("Scraped: ", okcText, okcUserName, okcPicture);

            chrome.runtime.sendMessage({content: summary}); //Passes the matched keywords as the final result. Will soon update to pass a JSON object

        }

        //This is the listener for the command to scrape received messages from the OKC inbox, and send back as an array
        if (msg.action == "scrapeMessages") {
            var namesArr = [];
            console.log("The content_script has been injected!");

            $('.unreadMessage, .readMessage, .repliedMessage, .filteredReadMessage').each(function(){
                if ($(this).text().search(new RegExp("We chose each other!", "i")) === -1) {
                    console.log ($(this).find('.subject').text());
                    namesArr.push(($(this).find('.subject').text()));
                }
            });
            console.log("Final namesArr: ", namesArr);
            sendResponse("Messages scraped");
            if (namesArr.length > 0) {
                chrome.runtime.sendMessage({messages: namesArr}); //Passes the matched keywords as the final result. Will soon update to pass a JSON object
            } else {
                chrome.runtime.sendMessage({messages: "Couldn't find any messages"});
            }
        }

        if (msg.portover) {
            console.log('Received command to send over a message. The message was:', msg.portover);
            $('#message_text').text(msg.portover);
            $('#action_message').text(msg.portover);
        }
    });
});
