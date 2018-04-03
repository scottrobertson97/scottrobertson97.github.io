// sound.js
"use strict";
// if app exists use the existing copy
// else create a new object literal
var app = app || {};

// define the .sound module and immediately invoke it in an IIFE
app.sound = (function(){
	console.log("sound.js module loaded");
	var bgAudio = undefined;
	var currentEffect = 0;
	var currentDirection = 1;
	var effectSounds = ["laser1.ogg", "laser2.ogg", "laser3.ogg", "laser4.ogg", "laser5.ogg", "laser6.ogg", "laser7.ogg", "laser8.ogg", "laser9.ogg"];

	function init(){
		bgAudio = document.querySelector("#bgAudio");
		bgAudio.volume=0.25;
	}
		
	function stopBGAudio(){
		bgAudio.pause();
		bgAudio.currentTime = 0;
	}
	
	function playEffect(){
    var effectSound = document.createElement('audio');
    effectSound.volume = 0.1;
		effectSound.src = "media/" + effectSounds[currentEffect];
		effectSound.play();
		currentEffect += currentDirection;
		if (currentEffect == effectSounds.length || currentEffect == -1){
			currentDirection *= -1;
			currentEffect += currentDirection;
		}
	}
	
	function playBGAudio(){
		bgAudio.play();
	}
	
	return {
		init: init,
		stopBGAudio: stopBGAudio,
		playBGAudio: playBGAudio,
		playEffect: playEffect
	};
		
	// export a public interface to this module
	// TODO
}());