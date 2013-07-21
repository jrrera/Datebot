
chrome.extension.onMessage.addListener(function (msg, sender, sendResponse) {
	if (msg.action == "scrape") {
		console.log("The content_script has been injected!");

		var okcText = $("#main_column").text().toLowerCase();
		var okcUserName = $('#basic_info_sn').text();
		var okcPicture = $('#thumb0 img').attr('src');

		var summary = [okcText, okcUserName, okcPicture];
		sendResponse("scraped");

		console.log("Scraped: ", okcText, okcUserName, okcPicture);
		console.log("Sent the response: scraped");
		chrome.runtime.sendMessage({content: summary}); //Passes the matched keywords as the final result. Will soon update to pass a JSON object
	}
});