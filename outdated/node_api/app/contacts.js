function listTags(tags) {
	var tagsList = "";
	tagsList += "<ul>";
	for (var i = 0; i < tags.length; i++) {
		tagsList += '<li>' + tags[i] + '</li>';
		console.log(tags[i]);
	}
	tagsList += "</ul>";
	return tagsList;
}

$(document).ready(function(){
	$.getJSON('/update:Jon',function(result){
		$.each(result, function(index, val){
			$('#contacts-list').append('<tr><td>' + val.value.contact + "</td><td> " + val.value.date + '</td><td>' + val.value.type + '</td><td>' + val.value.interaction + '</td><td>' + val.value.depth + '</td><td>' + listTags(val.value.tags) + '</td></tr>');	
		});
	});
});