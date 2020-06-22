class Keyboard {
	constructor(logKeystrokes = false) {
		this.logKeystrokes = logKeystrokes;
		this.keydown = [];
		this.previousKeydown = [];
		window.addEventListener("keydown",function(e){
			if(logKeystrokes)
				console.log("keydown=" + e.keyCode);
			this.keydown[e.keyCode] = true;
		}.bind(this));
			
		window.addEventListener("keyup",function(e){
			if(logKeystrokes)
				console.log("keyup=" + e.keyCode);
			this.keydown[e.keyCode] = false;
		}.bind(this));
	}

	static KEYBOARD = {
		"KEY_LEFT": 37, 
		"KEY_UP": 38, 
		"KEY_RIGHT": 39, 
		"KEY_DOWN": 40,
		"KEY_SPACE": 32,
		"KEY_SHIFT": 16,
		"KEY_W": 87,
		"KEY_S": 83,
		"KEY_A": 65,
		"KEY_D": 68
	}
}