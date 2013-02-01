$(function(){

	var videoInput = document.getElementById('inputVideo');
	var canvasInput = document.getElementById('inputCanvas');

	var htracker = new headtrackr.Tracker();
	htracker.init(videoInput, canvasInput);
	htracker.start();

	// van hier gepikt:
	// https://github.com/alexhancock/street-facing/blob/master/js/views/main.js
	$(document).on('headtrackingEvent', function(e){
		console.log(e.originalEvent.x + "," + e.originalEvent.y + "," + e.originalEvent.z);
	});

});