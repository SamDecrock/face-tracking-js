$(function(){

	var videoInput = document.getElementById('inputVideo');
	var canvasInput = document.getElementById('inputCanvas');

	var htracker = new headtrackr.Tracker();
	htracker.init(videoInput, canvasInput);
	htracker.start();

	function handleMovement(e){
		var head_x = e.originalEvent.x;
		var head_y = e.originalEvent.y / 2;
	}

	// van hier gepikt:
	// https://github.com/alexhancock/street-facing/blob/master/js/views/main.js
	$(document).on('headtrackingEvent', function(e){

		//console.log(e.originalEvent.x + "," + e.originalEvent.y + "," + e.originalEvent.z);

		_.throttle(handleMovement, 20);
	});

});