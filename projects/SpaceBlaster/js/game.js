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
	dt: 0,	//delta time
	animationID: 0,
	sound: undefined,
	gameState: undefined,
	lastState: undefined,
	GAME_STATE:	Object.freeze({
		MENU: 0,
		PLAYING: 1,
		PAUSED: 2,
		GAME_OVER: 3,
		TITLE: 4
	}),
	player: {},
	projectiles: [],
	enemies: [],
	stars: [],
	points: 0,
	lives: 3,
	playerLifeImage: undefined,
	PROJECTILE_TARGET: Object.freeze({
		PLAYER: 0,
		ENEMY: 1
	}),
	enemySpawnTime: 0,	//timer until a new wave spawns
	TIME_BETWEEN_ENEMY_SPAWNS: 10,	//time between waves
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
		//console.log("app.main.init() called");
		// initialize properties
		this.canvas = document.getElementById('canvas');
		this.canvas.width = this.WIDTH;
		this.canvas.height = this.HEIGHT;
		this.ctx = this.canvas.getContext('2d');
		
		//hook up events
		//the button on the title screen
		document.getElementById('enterbutton').onclick = (function(){
			//go to the menu
			this.gameState = this.GAME_STATE.MENU;
			//hide this button, diplay the button for the next screen
			document.getElementById('enterbutton').style.display = 'none';
			document.getElementById('playbutton').style.display = 'block';
		}).bind(this);
		//button on the menu/iintructions screen
		document.getElementById('playbutton').onclick = (function(){
			//start playing the game
			this.gameState = this.GAME_STATE.PLAYING;
			//reset the game
			this.reset();
			//start the sound
			this.sound.playBGAudio();
			//turn thisbutton off
			document.getElementById('playbutton').style.display = 'none';
		}).bind(this);
		//game over screen button
		document.getElementById('replaybutton').onclick = (function(){
			//set to playing, and restart
			this.gameState = this.GAME_STATE.PLAYING;
			this.reset();
			//turn this button off
			document.getElementById('replaybutton').style.display = 'none';
		}).bind(this);
		
		//get the image for the player lives in top right corner
		this.playerLifeImage = document.getElementById('playerLife');
		
		//set gamestate to title screen
		this.gameState = this.GAME_STATE.TITLE;
		//create player object
		this.createPlayer();
		//create star particles
		this.createStars();
		
		// start the game loop
		this.update();
	},

	update: function() {
		// 1) LOOP
		// schedule a call to update()
		this.animationID = requestAnimationFrame(this.update.bind(this));
		
		//get dt
		this.dt = this.calculateDeltaTime();
		
		//game state switch
		switch(this.gameState){
			case this.GAME_STATE.MENU:
				break;
			case this.GAME_STATE.PLAYING:
				//count down to spawn wave
				this.enemySpawnTime -= this.dt;
				//it is time to spawn a wave
				if(this.enemySpawnTime <=0){
					//reset the time
					this.enemySpawnTime = this.TIME_BETWEEN_ENEMY_SPAWNS;
					//make it so the time between is less
					this.TIME_BETWEEN_ENEMY_SPAWNS *= 0.9;
					//cap it at 1 second
					if(this.TIME_BETWEEN_ENEMY_SPAWNS < 2.0)
						this.TIME_BETWEEN_ENEMY_SPAWNS = 2.0;
					//spawn a wave with a rendom type
					if(Math.random() < 0.5)
						this.spawnWave(this.WAVE_TYPE.LINE);
					else
						this.spawnWave(this.WAVE_TYPE.WEDGE);
				}
				//update everything
				this.updateStars();
				this.playerControls();
				this.updatePlayer();
				this.updateEnemies();
				this.updateProjectiles();						
				break;
			case this.GAME_STATE.GAME_OVER:
				break;
			case this.GAME_STATE.PAUSED:
				cancelAnimationFrame(this.animationID);
				break;
		}
		//get the previous keys
		myKeys.previousKeydown = myKeys.keydown.slice();
		this.draw();
	},
	
	draw:function(){
		//draw black screen
		this.ctx.fillRect(0,0,this.canvas.width, this.canvas.height);	
		switch(this.gameState){
			case this.GAME_STATE.MENU:
				this.drawMenu();
				break;
			case this.GAME_STATE.PLAYING:
				//draw the things
				this.drawStars();
				this.drawProjectiles();	
				this.drawEnemies();
				this.drawPlayer();
				//draw HUD on top
				this.drawHUD();
				break;
			case this.GAME_STATE.GAME_OVER:				
				this.drawGameOver();
				break;
			case this.GAME_STATE.PAUSED:
				this.drawPauseScreen();
				break;
			case this.GAME_STATE.TITLE:
				this.drawTitle();
				break;
		}
	},
	
	drawHUD: function(){
		//player life image is 33x26
		//display the amount of images, for the amount of lives the player has
		switch(this.lives){
			case 3:
				this.ctx.drawImage(this.playerLifeImage, this.canvas.width - 33 * 3, 0, 33, 26);
			case 2:
				this.ctx.drawImage(this.playerLifeImage, this.canvas.width - 33 * 2, 0, 33, 26);
			case 1:
				this.ctx.drawImage(this.playerLifeImage, this.canvas.width - 33 * 1, 0, 33, 26);
				break;
		}
		
		this.ctx.save();
		this.ctx.font = '16pt Audiowide';
		this.ctx.fillStyle = 'white';
		this.ctx.fillText('Score: '+this.points,10,20);
		this.ctx.restore();
	},
	
	drawGameOver: function(){
		this.ctx.save();
		this.ctx.textAlign = "center";
		this.ctx.textBaseline = "middle";
		this.ctx.fillStyle = 'white';
		this.ctx.font = '16pt Audiowide';
		this.ctx.fillText("Game Over", this.canvas.width / 2, this.canvas.height / 2 - 20);
		this.ctx.fillText("You scored " + this.points + " points", this.canvas.width / 2, this.canvas.height / 2 + 20);
		this.ctx.restore();
	},
	
	drawTitle: function(){
		this.ctx.save();
		this.ctx.textAlign = "center";
		this.ctx.textBaseline = "middle";
		this.ctx.fillStyle = 'white';
		this.ctx.font = '30pt Audiowide';
		this.ctx.fillText("Welcome to Space Blaster!", this.canvas.width / 2, this.canvas.height / 2);
		this.ctx.restore();
	},
	
	drawMenu: function(){
		this.ctx.save();
		this.ctx.textAlign = "center";
		this.ctx.textBaseline = "middle";
		this.ctx.fillStyle = 'white';
		this.ctx.font = '16pt Audiowide';
		this.ctx.fillText("Controls:", this.canvas.width / 2, this.canvas.height / 2 - 40);
		this.ctx.fillText("WASD or Arrow Keys to move", this.canvas.width / 2, this.canvas.height / 2);
		this.ctx.fillText("SPACE to shoot", this.canvas.width / 2, this.canvas.height / 2 + 40);
		this.ctx.restore();
	},
	
	drawPauseScreen: function(){
		this.ctx.save();
		this.ctx.textAlign = "center";
		this.ctx.textBaseline = "middle";
		this.ctx.font = '40pt Audiowide';
		this.ctx.fillStyle = 'white';
		this.ctx.fillText("... PAUSED ...", this.WIDTH/2, this.HEIGHT/2);
		this.ctx.restore();
	},
	
	pauseGame: function(){
		cancelAnimationFrame(this.animationID);
		this.sound.stopBGAudio();
		//get the state it just was
		this.lastState = this.gameState;
		//set the state to paused
		this.gameState = this.GAME_STATE.PAUSED;
		//go back to the loop
		this.update();
	},
	
	resumeGame: function(){
		//cancel the animation frame
		cancelAnimationFrame(this.animationID);
		//if it just was playing, play the bg audio
		if(this.lastState == this.GAME_STATE.PLAYING)
			this.sound.playBGAudio();
		//go back to the last gamestate before the pause
		this.gameState = this.lastState;
		//go back to the loop
		this.update();
	},
	
	calculateDeltaTime: function() {
		var now, fps;
		now = performance.now();
		fps = 1000 / (now - this.lastTime);
		fps = clamp(fps, 12, 60);
		this.lastTime = now;
		return 1 / fps;
	},
	
	reset: function(){
		//reset the things
		this.player.position = {X: this.canvas.width/2, Y:this.canvas.height/2};
		this.player.hp = 3;
		this.lives = 3;
		this.projectiles = [];
		this.enemies = [];
		this.points = 0;
		this.enemyspawn = 0;
	},
	
	entityUpdate: function(entity){
		//update physics
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
		//if the entity is out of frame, move it back in
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
		//basic drag force
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
		//if the player is damaged, draw the damge sprites on top
		if(this.player.hp < 3)
			this.ctx.drawImage(this.player.dmgSprites[this.player.hp], this.player.position.X, this.player.position.Y, this.player.width, this.player.height);
	},
	
	playerControls: function(){
		
		var moving = false;
		
		//push the ship in the direction of the key presesd
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
		
		
		//decrement the timer
		this.player.timeUntilNextShot -= this.dt;
		
		//if space is pressed, and either it just wasn't(aka semi auto) or is full auto, and it is time
		if(myKeys.keydown[myKeys.KEYBOARD.KEY_SPACE] && (!myKeys.previousKeydown[myKeys.KEYBOARD.KEY_SPACE] || this.player.autoFire) && this.player.timeUntilNextShot <= 0){
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
		//create a projectile at where the player is
		var projectile = this.createEntity(this.player.position.X + this.player.width/2 - 5, this.player.position.Y, 10, 50, 'laser');
		projectile.target = this.PROJECTILE_TARGET.ENEMY;
		//push it forword
		this.entityApplyForce(projectile, {X:0, Y:-500} );
		//add it to the list
		this.projectiles.push(projectile);
		//play the sound effect
		this.sound.playEffect(3);
	},
	
	playerHit: function(){
		//lose health
		this.player.hp--;
		//if helath is 0, die
		if(this.player.hp < 0)
			this.die();
		
		//TODO more
		//console.log("player hit");
	},
	
	die: function(){
		//reset health
		this.player.hp = 3;
		//decrement lives
		this.lives --;
		//if the player has no live, then it is game over
		if(this.lives < 0){
			//set to game over
			this.gameState = this.GAME_STATE.GAME_OVER;
			//make the button visable
			document.getElementById('replaybutton').style.display = 'block';
			//stop the bg sound
			this.sound.stopBGAudio();
		}
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
			
			//if the target is an enemy and it hit the enemy
			if(this.projectiles[i].target == this.PROJECTILE_TARGET.ENEMY && this.checkIfEnemyIsHit(this.projectiles[i])){
				hitSomething = true;
			}
			
			//if it hit something or is out of the canvas, delete it
			if(hitSomething || this.entityIsOutOfFrame(this.projectiles[i])){
				this.projectiles.splice(i,1);
			}
		}
	},
	
	checkIfEnemyIsHit: function(projectile){
		//loop through enemies backwards
		for(var i = this.enemies.length - 1; i >= 0; i--){
			//if they are colliding
			if(this.isColliding(this.enemies[i], projectile)){
				//the enemy is hit
				this.enemyHit(this.enemies[i]);
				//if it has no hp left, remove it from the list
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
		//set the information based on type
		switch(type){
			case this.ENEMY_TYPE.BASIC:
				enemy= this.createEntity(x, y, 65, 50, 'enemy', 1);
				enemy.timeBetweenShots = 1.5;
				enemy.timeUntilNextShot = 0;
				break;
			case this.ENEMY_TYPE.HEAVY:
				enemy= this.createEntity(x, y, 65, 50, 'enemyBlack4', 2);
				enemy.timeBetweenShots = 3.0;
				enemy.timeUntilNextShot = 0;				
				break;
		}
		//set the information based on behavior
		switch(behavior){
			case this.ENEMY_BEHAVIOR.LINE:
				this.entityApplyForce(enemy, {X:0, Y:100} );
				break;
			case this.ENEMY_BEHAVIOR.ZIGZAG:
				//push it down and to the side
				this.entityApplyForce(enemy, {X:-100, Y:100} );
				//set the intervl that it will go back and forth
				enemy.behaviorTimeInterval = 1;
				//it is going left
				enemy.goingLeft = true;
				break;
		}
		enemy.type = type;
		enemy.behavior = behavior;
		//add to the list
		this.enemies.push(enemy);
		return enemy;
	},
	
	spawnWave: function(type){
		switch(type){
			//3 baasic enemies in a line that zigzag
			case this.WAVE_TYPE.LINE:
				var xPos = Math.random() * (this.canvas.width - 65 * 3); //fit 3 enemies
				//console.log("spawn wave");
				this.createEnemy(xPos + 65 * 0, 0 - 50, this.ENEMY_TYPE.BASIC, this.ENEMY_BEHAVIOR.ZIGZAG); //create first
				this.createEnemy(xPos + 65 * 1, 0 - 50, this.ENEMY_TYPE.BASIC, this.ENEMY_BEHAVIOR.ZIGZAG);
				this.createEnemy(xPos + 65 * 2, 0 - 50, this.ENEMY_TYPE.BASIC, this.ENEMY_BEHAVIOR.ZIGZAG);
				break;
			//3 enemies in a V formation, the one that is the head is a heavy, the others are basic
			case this.WAVE_TYPE.WEDGE:
				var xPos = Math.random() * (this.canvas.width - 65 * 3); //fit 3 enemies
				//console.log("spawn wave");
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
			
			//update time counter
			this.enemies[i].timeUntilNextShot -= this.dt;
			//if it is time to shoot
			if(this.enemies[i].timeUntilNextShot <= 0){
				//reset counter
				this.enemies[i].timeUntilNextShot = this.enemies[i].timeBetweenShots;
				//shoot
				this.enemyShoot(this.enemies[i]);
			}
			
			//if they move off screen
			if(this.enemies[i].position.Y > this.canvas.height)
				this.enemies.splice(i,1);
		}
	},
	
	drawEnemies:function(){
		for(var i = 0; i < this.enemies.length; i++){
			this.entityDraw(this.enemies[i]);
		}
	},
	
	enemyShoot: function(enemy){
		//create a projectie where the enemy is
		var projectile = this.createEntity(enemy.position.X + enemy.width/2 - 5, enemy.position.Y, 10, 50, 'laserEnemy');
		//set the target
		projectile.target = this.PROJECTILE_TARGET.PLAYER;
		//push forwords
		this.entityApplyForce(projectile, {X:0, Y:500} );
		//add to the list
		this.projectiles.push(projectile);
		
		//play the correct sound effect
		if(enemy.type == this.ENEMY_TYPE.BASIC)
			this.sound.playEffect(0);
		else if(enemy.type == this.ENEMY_TYPE.HEAVY)
			this.sound.playEffect(3);
	},
		
	enemyHit: function(enemy){
		enemy.hp--;
		this.points += 10;
	},
	
	createStars: function(){
		this.stars = [];
		//make 50 stars
		for(var i = 0; i < 50; i++){
			//type is 1, 2, or 3
			var type = Math.floor(Math.random() * 3) + 1;
			var size = type;
			//big ones move faster, this creates a paralax effect
			var speed = type * 1.5;
			//place randomly on the canvas
			var x = Math.random() * this.canvas.width;
			var y = Math.random() * this.canvas.height;
			
			//make the object literal, and push in onto the list
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
			//move them
			this.stars[i].Y+=this.stars[i].speed;	
			//if they go off screen put the on top, and give them a random x position
			if(this.stars[i].Y > this.canvas.height){
				this.stars[i].Y = 0 - this.stars[i].size;
				this.stars[i].X = Math.random() * this.canvas.width;
			}
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