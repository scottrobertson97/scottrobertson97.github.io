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
	dt: 0,
	animationID: 0,
	//sound: undefined,
	//myKeys: undefined,
	gameState: undefined,
	GAME_STATE:	Object.freeze({
		MENU: 0,
		PLAYING: 1,
		PAUSED: 2
	}),
	player: {},
	projectiles: [],
	enemies: [],
	stars: [],
	PROJECTILE_TARGET: Object.freeze({
		PLAYER: 0,
		ENEMY: 1
	}),
	enemyspawn: 0,
	WAVE_TYPE: Object.freeze({
		LINE: 0,
		WEDGE: 1
	}),
	ENEMY_TYPE: Object.freeze({
		BASIC: 0,
		HEAVY: 1
	}),
	ENEMY_BEHAVIOR: Object.freeze({
		LINE: 0,
		ZIGZAG: 1
	}),
	
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
		this.createStars();
		
		//this.bgAudio = document.querySelector("#bgAudio");
		//this.bgAudio.volume = 0.25;
		
		// start the game loop
		this.update();
	},

	update: function() {
		// 1) LOOP
		// schedule a call to update()
		this.animationID = requestAnimationFrame(this.update.bind(this));
		this.dt = this.calculateDeltaTime();
		
		switch(this.gameState){
			case this.GAME_STATE.MENU:
				break;
			case this.GAME_STATE.PLAYING:
				this.enemyspawn -= this.dt;
				if(this.enemyspawn <=0){
					this.enemyspawn = 5;
					if(Math.random() < 0.5)
						this.spawnWave(this.WAVE_TYPE.LINE);
					else
						this.spawnWave(this.WAVE_TYPE.WEDGE);
				}
				this.updateStars();
				this.playerControls();
				this.updatePlayer();
				this.updateEnemies();
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
				this.drawStars();
				this.drawProjectiles();	
				this.drawEnemies();
				this.drawPlayer();
				break;
			case this.GAME_STATE.PAUSED:
				break;
		}
	},
	
	calculateDeltaTime: function() {
		var now, fps;
		now = performance.now();
		fps = 1000 / (now - this.lastTime);
		fps = clamp(fps, 12, 60);
		this.lastTime = now;
		return 1 / fps;
	},
	
	/*doMousedown:function(e){		
		var mouse = getMouse(e);
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
		
		entity.position.X += entity.velocity.X * this.dt;
		entity.position.Y += entity.velocity.Y * this.dt;
		
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
		this.player = this.createEntity(this.canvas.width/2, this.canvas.height/2, 65, 50, 'ship', 3);
		this.player.timeBetweenShots = 0.2;
		this.player.timeUntilNextShot = 0;
		this.player.autoFire = true;
		this.player.dmgSprites = [document.getElementById("dmg3"), document.getElementById("dmg2"), document.getElementById("dmg1")];
	},
	
	updatePlayer: function(){
		this.entityUpdate(this.player);
		this.entityKeepInFrame(this.player);
	},
	
	drawPlayer: function(){
		this.entityDraw(this.player);
		if(this.player.hp < 3)
			this.ctx.drawImage(this.player.dmgSprites[this.player.hp], this.player.position.X, this.player.position.Y, this.player.width, this.player.height);
	},
	
	playerControls: function(){
		this.player.timeUntilNextShot -= this.dt;
		if(this.player.timeUntilNextShot <= 0)
			this.player.timeUntilNextShot = 0;
		
		var moving = false;
		
		if(myKeys.keydown[myKeys.KEYBOARD.KEY_RIGHT] || myKeys.keydown[myKeys.KEYBOARD.KEY_D]){
			this.entityApplyForce(this.player, {X:20,Y:0});
			moving = true;
		}
		if(myKeys.keydown[myKeys.KEYBOARD.KEY_LEFT] || myKeys.keydown[myKeys.KEYBOARD.KEY_A]){
			this.entityApplyForce(this.player, {X:-20,Y:0});
			moving = true;
		}
		if(myKeys.keydown[myKeys.KEYBOARD.KEY_UP] || myKeys.keydown[myKeys.KEYBOARD.KEY_W]){
			this.entityApplyForce(this.player, {X:0,Y:-20});
			moving = true;
		}
		if(myKeys.keydown[myKeys.KEYBOARD.KEY_DOWN] || myKeys.keydown[myKeys.KEYBOARD.KEY_S]){
			this.entityApplyForce(this.player, {X:0,Y:20});
			moving = true;
		}
		if(!moving){
			this.entityApplyDrag(this.player);
		}
		
		//if space is pressed, and either it just wasn't(aka semi auto) or is full auto, and it is time
		if(myKeys.keydown[myKeys.KEYBOARD.KEY_SPACE] && (!myKeys.previousKeydown[myKeys.KEYBOARD.KEY_SPACE] || this.player.autoFire) && this.player.timeUntilNextShot == 0){
			this.playerShoot();
			this.player.timeUntilNextShot = this.player.timeBetweenShots; 
		}
	},
	
	createEntity: function(x, y, width, height, sprite, hp=0){
		var entity = {};
		entity.position = {X: x, Y: y};
		entity.velocity = {X: 0, Y: 0};
		entity.acceleration = {X: 0, Y: 0};
		entity.width = width;
		entity.height = height;
		entity.sprite = document.getElementById(sprite);
		entity.hp = hp;
		return entity;
	},
	
	//AABB collision of 2 entities
	isColliding: function(entity1, entity2){
		if(entity1.position.X < entity2.position.X + entity2.width &&
		  entity1.position.X + entity1.width > entity2.position.X &&
		  entity1.position.Y < entity2.position.Y + entity2.height &&
		  entity1.position.Y + entity1.height > entity2.position.Y){
			return true;
		}
		else {
			return false;
		}
	},
	
	//creates projectile, and shoots it foward
	playerShoot: function(){
		var projectile = this.createEntity(this.player.position.X + this.player.width/2 - 5, this.player.position.Y, 10, 50, 'laser');
		projectile.target = this.PROJECTILE_TARGET.ENEMY;
		this.entityApplyForce(projectile, {X:0, Y:-500} );
		this.projectiles.push(projectile);
	},
	
	playerHit: function(){
		this.player.hp--;
		if(this.player.hp < 0)
			this.die();
		
		//TODO more
		console.log("player hit");
	},
	
	die: function(){
		this.player.hp = 3;
		//TODO		
	},
	
	//do physics update for all projectiles
	updateProjectiles: function(){
		//loop through projectiles backwards
		for(var i = this.projectiles.length -1; i >= 0; i--){
			//update
			this.entityUpdate(this.projectiles[i], this.dt);
			
			var hitSomething = false;
			
			//if the target is the player, and they collide, the player takes a hit
			if(this.projectiles[i].target == this.PROJECTILE_TARGET.PLAYER && this.isColliding(this.projectiles[i], this.player)){
				this.playerHit();
				hitSomething = true;
			}
			
			if(this.projectiles[i].target == this.PROJECTILE_TARGET.ENEMY && this.checkIfEnemyIsHit(this.projectiles[i])){
					hitSomething = true;
			}
			
			//if it is out of the canvas, delete it
			if(hitSomething || this.entityIsOutOfFrame(this.projectiles[i])){
				this.projectiles.splice(i,1);
			}
		}
	},
	
	checkIfEnemyIsHit: function(projectile){
		for(var i = this.enemies.length - 1; i >= 0; i--){
			if(this.isColliding(this.enemies[i], projectile)){
				this.enemyHit(this.enemies[i]);
				
				if(this.enemies[i].hp <= 0)
					this.enemies.splice(i,1);
					
				return true;
			}
		}
		return false;
	},
	
	//draw all projectiles
	drawProjectiles: function(){
		//loop through projectiles and draw them
		for(var i = 0; i < this.projectiles.length; i++){
			this.entityDraw(this.projectiles[i]);
		}
	},
	
	createEnemy: function(x, y, type, behavior){
		var enemy;
		switch(type){
			case this.ENEMY_TYPE.BASIC:
				enemy= this.createEntity(x, y, 65, 50, 'enemy', 1);
				enemy.timeBetweenShots = 0.75;
				enemy.timeUntilNextShot = 0;
				break;
			case this.ENEMY_TYPE.HEAVY:
				enemy= this.createEntity(x, y, 65, 50, 'ship', 2);
				enemy.timeBetweenShots = 1.0;
				enemy.timeUntilNextShot = 0;				
				break;
		}
		switch(behavior){
			case this.ENEMY_BEHAVIOR.LINE:
				this.entityApplyForce(enemy, {X:0, Y:100} );
				break;
			case this.ENEMY_BEHAVIOR.ZIGZAG:
				this.entityApplyForce(enemy, {X:-100, Y:100} );
				enemy.behaviorTimeInterval = 1;
				enemy.goingLeft = true;
				break;
		}
		enemy.type = type;
		enemy.behavior = behavior;
		this.enemies.push(enemy);
		return enemy;
	},
	
	spawnWave: function(type){
		switch(type){
			case this.WAVE_TYPE.LINE:
				var xPos = Math.random() * (this.canvas.width - 65 * 3); //fit 3 enemies
				console.log("spawn wave");
				this.createEnemy(xPos + 65 * 0, 0 - 50, this.ENEMY_TYPE.BASIC, this.ENEMY_BEHAVIOR.ZIGZAG); //create first
				this.createEnemy(xPos + 65 * 1, 0 - 50, this.ENEMY_TYPE.BASIC, this.ENEMY_BEHAVIOR.ZIGZAG);
				this.createEnemy(xPos + 65 * 2, 0 - 50, this.ENEMY_TYPE.BASIC, this.ENEMY_BEHAVIOR.ZIGZAG);
				break;
			case this.WAVE_TYPE.WEDGE:
				var xPos = Math.random() * (this.canvas.width - 65 * 3); //fit 3 enemies
				console.log("spawn wave");
				this.createEnemy(xPos + 65 * 0, 0 - 100, this.ENEMY_TYPE.BASIC, this.ENEMY_BEHAVIOR.LINE); //create first
				this.createEnemy(xPos + 65 * 1, 0 - 50, this.ENEMY_TYPE.HEAVY, this.ENEMY_BEHAVIOR.LINE);
				this.createEnemy(xPos + 65 * 2, 0 - 100, this.ENEMY_TYPE.BASIC, this.ENEMY_BEHAVIOR.LINE);
				break;
		}
	},
	
	updateEnemies:function(){
		for(var i = this.enemies.length-1; i >= 0; i--){
			//behave
			switch(this.enemies[i].behavior){
				case this.ENEMY_BEHAVIOR.LINE:
					break;
				case this.ENEMY_BEHAVIOR.ZIGZAG:
					//decrement time
					this.enemies[i].behaviorTimeInterval -= this.dt;
					//if it is tine
					if(this.enemies[i].behaviorTimeInterval <= 0){
						this.enemies[i].behaviorTimeInterval = 1;
						//go left or right
						if(this.enemies[i].goingLeft){
							this.entityApplyForce(this.enemies[i], {X:200, Y:0} );
							this.enemies[i].goingLeft = false;
						}
						else{
							this.entityApplyForce(this.enemies[i], {X:-200, Y:0} );
							this.enemies[i].goingLeft = true;
						}
					}
					break;
			}
			
			//physic update
			this.entityUpdate(this.enemies[i]);
			
			//if they move off screen
			if(this.enemies[i].position.Y > this.canvas.height)
				this.enemies.splice(i,1);
			
			//update time counter
			this.enemies[i].timeUntilNextShot -= this.dt;
			//if it is time to shoot
			if(this.enemies[i].timeUntilNextShot <= 0){
				//reset counter
				this.enemies[i].timeUntilNextShot = this.enemies[i].timeBetweenShots;
				//shoot
				this.enemyShoot(this.enemies[i]);
			}
		}
	},
	
	drawEnemies:function(){
		for(var i = 0; i < this.enemies.length; i++){
			this.entityDraw(this.enemies[i]);
		}
	},
	
	enemyShoot: function(enemy){
		var projectile = this.createEntity(enemy.position.X + enemy.width/2 - 5, enemy.position.Y, 10, 50, 'laserEnemy');
		projectile.target = this.PROJECTILE_TARGET.PLAYER;
		this.entityApplyForce(projectile, {X:0, Y:500} );
		this.projectiles.push(projectile);
	},
		
	enemyHit: function(enemy){
		enemy.hp--;		
	},
	
	createStars: function(){
		for(var i = 0; i < 50; i++){
			var type = Math.floor(Math.random() * 3) + 1;
			var size = type;
			var speed = type * 1.5;
			var x = Math.random() * this.canvas.width;
			var y = Math.random() * this.canvas.height;
			
			this.stars.push({
				X: x,
				Y: y,
				size: size,
				speed: speed
			});
		}
	},
	
	updateStars: function(){
		for(var i = 0; i < this.stars.length; i++){
			this.stars[i].Y+=this.stars[i].speed;			
			if(this.stars[i].Y > this.canvas.height)
				this.stars[i].Y = 0 - this.stars[i].size;
		}
	},
	
	drawStars: function(){
		this.ctx.save();
		this.ctx.fillStyle = 'white';
		for(var i = 0; i < this.stars.length; i++){
			this.ctx.fillRect(this.stars[i].X, this.stars[i].Y, this.stars[i].size, this.stars[i].size);
		}
		this.ctx.restore();
	}
}; // end app.main