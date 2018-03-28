// main.js
// Dependencies: 
// Description: singleton object
// This object will be our main "controller" class and will contain references
// to most of the other objects in the game.

"use strict";

// if app exists use the existing copy
// else create a new object literal
var app = app || {};

/*
 .main is an object literal that is a property of the app global
 This object literal has its own properties and methods (functions)
 
 */
app.game = {
	//  properties
	WIDTH: 800,
	HEIGHT: 600,
	canvas: undefined,
	ctx: undefined,
	lastTime: 0, // used by calculateDeltaTime() 
	//animationID: 0,
	//sound: undefined,
	//myKeys: undefined,
	gameState: undefined,
	GAME_STATE:	Object.freeze({
		MENU: "menu",
		PLAYING: "playing",
		PAUSED: "paused"
	}),
	player: {},
	projectiles: [],
	
	// methods
	init: function() {
		console.log("app.main.init() called");
		// initialize properties
		this.canvas = document.querySelector('canvas');
		this.canvas.width = this.WIDTH;
		this.canvas.height = this.HEIGHT;
		this.ctx = this.canvas.getContext('2d');
		
		//hook up events
		//this.canvas.onmousedown = this.doMousedown.bind(this);
		
		this.gameState = this.GAME_STATE.PLAYING;
		this.createPlayer();
		
		
		//this.bgAudio = document.querySelector("#bgAudio");
		//this.bgAudio.volume = 0.25;
		
		// start the game loop
		this.update();
	},

	update: function() {
		// 1) LOOP
		// schedule a call to update()
		this.animationID = requestAnimationFrame(this.update.bind(this));
		
		switch(this.gameState){
			case this.GAME_STATE.MENU:
				break;
			case this.GAME_STATE.PLAYING:
				this.playerControls();
				this.updatePlayer();
				this.updateProjectiles();						
				break;
			case this.GAME_STATE.PAUSED:
				break;
		}
		myKeys.previousKeydown = myKeys.keydown.slice();
		this.draw();
	},
	
	draw:function(){
		switch(this.gameState){
			case this.GAME_STATE.MENU:
				break;
			case this.GAME_STATE.PLAYING:
				this.ctx.fillRect(0,0,this.canvas.width, this.canvas.height);
				this.entityDraw(this.player);
				this.drawProjectiles();						
				break;
			case this.GAME_STATE.PAUSED:
				break;
		}
	},
	
	/*doMousedown:function(e){		
		var mouse = getMouse(e);
	},

	calculateDeltaTime: function() {
		var now, fps;
		now = performance.now();
		fps = 1000 / (now - this.lastTime);
		fps = clamp(fps, 12, 60);
		this.lastTime = now;
		return 1 / fps;
	},
	
	drawPauseScreen: function(ctx){
		ctx.save();
		ctx.fillStyle = "black";
		ctx.fillRect(0,0,this.WIDTH,this.HEIGHT);
		ctx.textAlign = "center";
		ctx.textBaseline = "middle";
		this.fillText("... PAUSED ...", this.WIDTH/2, this.HEIGHT/2, "40pt courier", "white");
		ctx.restore();
	},
	
	pauseGame: function(){
		this.paused = true;
		cancelAnimationFrame(this.animationID);
		this.stopBGAudio();
		this.update();
	},
	
	resumeGame: function(){
		cancelAnimationFrame(this.animationID);
		this.paused = false;
		this.sound.playBGAudio();
		this.update();
	},
	
	playEffect: function(){
		var effectSound = document.createElement("audio");
		effectSound.volume = 0.3;
		effectSound.src = "media/" + this.effectSounds[this.currentEffect];
		effectSound.play();
		this.currentEffect += this.currentDirection;
		if(this.currentEffect == this.effectSounds.length || this.currentEffect == -1){
			this.currentDirection *= -1;
			this.currentEffect += this.currentDirection;
		}
	},*/
	
	//stopBGAudio: function(){
	//	this.sound.stopBGAudio();
	//},
	
	entityUpdate: function(entity){
		entity.velocity.X += entity.acceleration.X;
		entity.velocity.Y += entity.acceleration.Y;
		
		entity.position.X += entity.velocity.X * (1/60);
		entity.position.Y += entity.velocity.Y * (1/60);
		
		entity.acceleration.X = 0;
		entity.acceleration.Y = 0;
	},
	
	entityDraw: function(entity){
		this.ctx.drawImage(entity.sprite, entity.position.X, entity.position.Y, entity.width, entity.height);
	},
	
	entityApplyForce: function(entity, force){
		entity.acceleration.X += force.X;
		entity.acceleration.Y += force.Y;
	},
	
	entityIsOutOfFrame: function(entity){
		if(entity.position.X < 0 + this.canvas.width &&	
			 entity.position.X + entity.width > 0 &&
			 entity.position.Y < 0 + this.canvas.height &&
			 entity.position.Y + entity.height > 0){
			return false;
		}
		else {
			return true;
		}
	},
	
	entityKeepInFrame: function(entity){
		if(entity.position.X < 0){
			entity.position.X = 0;
			entity.velocity.X = 0;
		}
		else if(entity.position.X + entity.width > this.canvas.width){
			entity.position.X = this.canvas.width - entity.width;
			entity.velocity.X = 0;
		}
		if(entity.position.Y < 0){
			entity.position.Y = 0;
			entity.velocity.Y = 0;
		}
		else if(entity.position.Y + entity.height > this.canvas.height){
			entity.position.Y = this.canvas.height - entity.height;
			entity.velocity.Y = 0;
		}
	},
	
	entityApplyDrag: function(entity){
		var force = {
			X: -0.1 * entity.velocity.X,
			Y: -0.1 * entity.velocity.Y
		};
		this.entityApplyForce(entity, force);
	},
	
	createPlayer: function(){
		this.player.position = {X: this.canvas.width/2, Y:this.canvas.height/2};
		this.player.velocity = {X: 0, Y: 0};
		this.player.acceleration = {X: 0, Y: 0};
		this.player.width = 50;
		this.player.height = 50;
		this.player.sprite = document.getElementById('ship');
		this.player.hp = 3;
	},
	
	updatePlayer: function(){
		this.entityUpdate(this.player);
		this.entityKeepInFrame(this.player);
	},
	
	playerControls: function(){
		var moving = false;
		
		if(myKeys.keydown[myKeys.KEYBOARD.KEY_RIGHT]){
			this.entityApplyForce(this.player, {X:20,Y:0});
			moving = true;
		}
		if(myKeys.keydown[myKeys.KEYBOARD.KEY_LEFT]){
			this.entityApplyForce(this.player, {X:-20,Y:0});
			moving = true;
		}
		if(myKeys.keydown[myKeys.KEYBOARD.KEY_UP]){
			this.entityApplyForce(this.player, {X:0,Y:-20});
			moving = true;
		}
		if(myKeys.keydown[myKeys.KEYBOARD.KEY_DOWN]){
			this.entityApplyForce(this.player, {X:0,Y:20});
			moving = true;
		}
		if(!moving){
			this.entityApplyDrag(this.player);
		}
		
		if(myKeys.keydown[myKeys.KEYBOARD.KEY_SPACE] && !myKeys.previousKeydown[myKeys.KEYBOARD.KEY_SPACE]){
			this.shoot();
		}
	},
	
	shoot: function(){
		var projectile = {};
		projectile.position = {X: this.player.position.X, Y: this.player.position.Y};
		projectile.velocity = {X: 0, Y: 0};
		projectile.acceleration = {X: 0, Y: 0};
		projectile.width = 10;
		projectile.height = 50;
		projectile.sprite = document.getElementById('lazer');
		this.entityApplyForce(projectile, {X:0, Y:-500} );
		this.projectiles.push(projectile);
	},
	
	updateProjectiles: function(){
		for(var i = this.projectiles.length -1; i >= 0; i--){
			this.entityUpdate(this.projectiles[i]);
			if(this.entityIsOutOfFrame(this.projectiles[i])){
				this.projectiles.splice(i,1);
			}
		}
	},
	
	drawProjectiles: function(){
		for(var i = 0; i < this.projectiles.length; i++){
			this.entityDraw(this.projectiles[i]);
		}
	}
}; // end app.main