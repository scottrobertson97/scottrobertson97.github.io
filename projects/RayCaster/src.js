"use strict";

window.onload = init;

const c = document.getElementById("myCanvas");
const ctx = c.getContext("2d");

const TAU = Math.PI * 2;
const P2 = Math.PI / 2;
const P3 = 3 * Math.PI / 2;
const DR = Math.PI / 180; // one degree in radians

const viewW = 512; //view width
const view = {width: 512, height: 512};
const fov = 60;
let horRes = 8; //horizontal resolution, higher number = less resolution

const walls = [];
walls.size = 8;
walls[0] = [];
walls[1] = ['#FF0000', '#FF0000', '#FF0000', '#FF0000',];
walls[2] = [
	'#00FFFF', '#00FF00', '#00FFFF', '#00FF00', '#00FFFF', '#00FF00', '#00FFFF', '#00FF00',
	'#00FF00', '#00FFFF', '#00FF00', '#00FFFF', '#00FF00', '#00FFFF', '#00FF00', '#00FFFF',
	'#00FFFF', '#00FF00', '#00FFFF', '#00FF00', '#00FFFF', '#00FF00', '#00FFFF', '#00FF00',
	'#00FF00', '#00FFFF', '#00FF00', '#00FFFF', '#00FF00', '#00FFFF', '#00FF00', '#00FFFF',
	'#00FFFF', '#00FF00', '#00FFFF', '#00FF00', '#00FFFF', '#00FF00', '#00FFFF', '#00FF00',
	'#00FF00', '#00FFFF', '#00FF00', '#00FFFF', '#00FF00', '#00FFFF', '#00FF00', '#00FFFF',
	'#00FFFF', '#00FF00', '#00FFFF', '#00FF00', '#00FFFF', '#00FF00', '#00FFFF', '#00FF00',
	'#00FF00', '#00FFFF', '#00FF00', '#00FFFF', '#00FF00', '#00FFFF', '#00FF00', '#00FFFF'
];

const map = {
	x: 8, y: 8, s:64,
	grid:[
		1,1,1,1,1,1,1,1,
		1,0,1,0,0,2,1,1,
		1,0,1,0,0,0,1,1,
		1,0,0,0,0,0,0,1,
		1,0,0,0,0,0,0,1,
		1,0,0,0,0,2,0,1,
		1,0,0,0,0,0,0,1,
		1,1,1,1,1,1,1,1	
	] ,
	draw: () => {
		let color = 'white';
		for(let y = 0; y < map.y; y++){
			for(let x = 0; x < map.x; x++){
				if(map.grid[y*map.y+x]==1)
					color = 'white';
				else
					color = 'black';
				let xo = x*map.s;
				let yo = y*map.s;

				ctx.fillStyle = color;
				ctx.fillRect(xo+1, yo+1, map.s-1, map.s-1);
			}
		}
	}
};

//#region keyboard
var myKeys = {};

myKeys.KEYBOARD = Object.freeze({
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
});

myKeys.keydown = [];
myKeys.previousKeydown = [];


// event listeners
window.addEventListener("keydown",function(e){
	//console.log("keydown=" + e.keyCode);
	myKeys.keydown[e.keyCode] = true;
});
	
window.addEventListener("keyup",function(e){
	//console.log("keyup=" + e.keyCode);
	myKeys.keydown[e.keyCode] = false;
});
//#endregion

const player =  {
	x:0, y:0, dx:0, dy:0, a:0, speed: 5,
	draw: () => {
		ctx.fillStyle = 'yellow';
		ctx.fillRect(player.x-5, player.y-5, 10, 10);
		ctx.beginPath();
		ctx.moveTo(player.x, player.y);
		ctx.lineTo(player.x + player.dx * 5, player.y + player.dy * 5);
		ctx.strokeStyle = 'yellow';
		ctx.lineWidth = 1;
		ctx.stroke();
		//ctx.beginPath();
		//ctx.arc(player.x, player.y, 5, 0, TAU);
		//ctx.fill();
	}
}

function init() {	
	player.x = 300;
	player.y = 300;
	player.dx = Math.cos(player.a) *5;
	player.dy = Math.sin(player.a) *5;
	update();
}

function update() {
	playerControls();	
	draw();
	requestAnimationFrame(update);
}

function draw() {
	ctx.fillStyle = 'gray';
	ctx.fillRect(0, 0, 1024, 512);
	map.draw();
	
	drawRays2D();
	player.draw();
}

function playerControls() {
	if(myKeys.keydown[myKeys.KEYBOARD.KEY_RIGHT] || myKeys.keydown[myKeys.KEYBOARD.KEY_D]){
		player.a += 0.1;
		if(player.a > TAU ) player.a = 0;
		player.dx = Math.cos(player.a) * player.speed;
		player.dy = Math.sin(player.a) * player.speed;
	}
	if(myKeys.keydown[myKeys.KEYBOARD.KEY_LEFT] || myKeys.keydown[myKeys.KEYBOARD.KEY_A]){
		player.a -= 0.1;
		if(player.a < 0 ) player.a = TAU;
		player.dx = Math.cos(player.a) * player.speed;
		player.dy = Math.sin(player.a) * player.speed;
	}
	if(myKeys.keydown[myKeys.KEYBOARD.KEY_UP] || myKeys.keydown[myKeys.KEYBOARD.KEY_W]){
		player.x += player.dx;
		player.y += player.dy;
	}
	if(myKeys.keydown[myKeys.KEYBOARD.KEY_DOWN] || myKeys.keydown[myKeys.KEYBOARD.KEY_S]){
		player.x -= player.dx;
		player.y -= player.dy;
	}
}

function dist( ax, ay, bx, by, ang){	
	return (Math.sqrt(Math.pow((bx-ax), 2) + Math.pow((by-ay), 2)));
}

function drawRays2D() {
	ctx.fillStyle = 'gray';
	ctx.fillRect(512,0,512,256);
	ctx.fillStyle = '#333';
	ctx.fillRect(512,256,512,256);

	let colorMod = 1;

	let ray = {x:0, y:0, a:0};
	//map x, map y, map pos, depth of field, x offset, y offset, final distance
	let mx, my, mp, dof, xo, yo, disT;

	ray.a = player.a - DR*(fov/2);
	if(ray.a < 0)
		ray.a += TAU;
	if(ray.a > TAU)
		ray.a -= TAU;

	for(let r = 0; r < view.width/horRes; r++) {
		//#region other
		let isVertical, isLeft, isUp, mpv, mph;
		//#endregion		

		//#region ---horizontal line check---
		dof = 0;
		//horizontal ray distance, x, y
		let disH = 1000000;
		let hx = player.x;
		let hy = player.y;

		let aTan = -1 / Math.tan(ray.a);
		if(ray.a>Math.PI) { //looking up
			ray.y = ((Math.trunc(player.y) >>6)<<6)-0.0001;
			ray.x = (player.y- ray.y) * aTan + player.x;
			yo=-64; xo=-yo*aTan;
			isUp = true;	
		}
		if(ray.a<Math.PI) { //looking down
			ray.y = ((Math.trunc(player.y) >>6)<<6)+64;
			ray.x = (player.y- ray.y) * aTan + player.x;
			yo=64; xo=-yo*aTan;
			isUp = false;
		}
		if(ray.a == 0 || ray.a == Math.PI) { //looking straight left or right
			ray.x = player.x;
			ray.y = player.y;
			dof = 8;
		}
		while(dof < 8) {
			mx = Math.trunc(ray.x)>>6;
			my = Math.trunc(ray.y)>>6;
			mp = my * map.x + mx;
			if(mp > 0 && mp < map.x * map.y && map.grid[mp] > 0) { //hit wall
				hx = ray.x;
				hy = ray.y;
				disH = dist(player.x, player.y, hx, hy, ray.a);
				mph = mp;
				dof = 8;
			} 
			else {
				ray.x += xo;
				ray.y += yo;
				dof +=1 ;
			}
		}
		//#endregion

		//#region ---vertical line check---
		dof = 0;
		//vertical ray distance, x, y
		let disV = 1000000;
		let vx = player.x;
		let vy = player.y;
		
		let nTan = -Math.tan(ray.a);
		if(ray.a > P2 && ray.a < P3) { //looking left
			ray.x = ((Math.trunc(player.x) >>6)<<6)-0.0001;
			ray.y = (player.x- ray.x) * nTan + player.y;
			xo=-64; yo=-xo*nTan;
			isLeft = true;
		}
		if(ray.a < P2 || ray.a > P3) { //looking right
			ray.x = ((Math.trunc(player.x) >>6)<<6)+64;
			ray.y = (player.x- ray.x) * nTan + player.y;
			xo=64; yo=-xo*nTan;
			isLeft = false;
		}
		if(ray.a == 0 || ray.a == Math.PI) { //looking straight up or down
			ray.x = player.x;
			ray.y = player.y;
			dof = 8;
		}
		while(dof < 8) {
			mx = Math.trunc(ray.x)>>6;
			my = Math.trunc(ray.y)>>6;
			mp = my * map.x + mx;
			if(mp > 0 && mp < map.x * map.y && map.grid[mp] > 0) { //hit wall
				vx = ray.x;
				vy = ray.y;
				disV = dist(player.x, player.y, vx, vy, ray.a);
				mpv = mp;
				dof = 8; 
			}
			else {
				ray.x += xo;
				ray.y += yo;
				dof +=1 ;
			}
		}
		//#endregion
		
		//#region  vertical or horizontal
		if(disV < disH) {
			ray.x = vx;
			ray.y = vy;
			disT = disV;
			isVertical = true;
			colorMod = 1;
			mp = mpv;
		}
		if(disH < disV) {
			ray.x = hx;
			ray.y = hy;
			disT = disH;
			isVertical = false;
			colorMod = 0.5;
			mp = mph;
		}
		//#endregion

		//#region draw 2d
		ctx.beginPath();
		ctx.moveTo(player.x, player.y);
		ctx.lineTo(ray.x, ray.y);
		ctx.strokeStyle = 'red';
		ctx.lineWidth = 1;
		ctx.stroke();
		//#endregion

		//#region Draw 3D Walls
		let ca = player.a - ray.a;
		if(ca < 0)
			ca += TAU;
		if(ca > TAU)
			ca -= TAU;

		disT *= Math.cos(ca);//fix fisheye

		let lineH = (map.s*view.height)/disT; //line height
		
		if(lineH > view.height)
			lineH = view.height;

		let lineO = (view.height/2) - lineH/2; //line offset

		if(map.grid[mp] == 1) {
			ctx.beginPath();
			ctx.moveTo(r*horRes + (view.height + horRes/2) , lineO);
			ctx.lineTo(r*horRes + (view.height + horRes/2), lineH + lineO);
			ctx.strokeStyle = `rgb(${(lineH/view.height) * 256 * colorMod},0,0)`;
			ctx.lineWidth = horRes;
			ctx.stroke();
		} else if(map.grid[mp] > 0) {
			let percentage;
			if(!isVertical && isUp){ //bottom face
				percentage = (ray.x%map.s) / map.s;
			} else if(!isVertical && !isUp){ //top face
				percentage = 1 - (ray.x%map.s) / map.s;
			} else if(isVertical && !isLeft){ //left face
				percentage = (ray.y%map.s) / map.s;
			} else if(isVertical && isLeft){ //right face
				percentage = 1 - (ray.y%map.s) / map.s;
			} 

			let pixelX = Math.trunc(walls.size * percentage);
			
			for(let i = 0; i < walls.size; i++){
				ctx.beginPath();
				ctx.moveTo(r*horRes + (view.height + horRes/2) , lineH *(i/walls.size) +lineO);
				ctx.lineTo(r*horRes + (view.height + horRes/2), lineH *((i+1)/walls.size) + lineO);
				ctx.strokeStyle = walls[map.grid[mp]][i * walls.size + pixelX];
				ctx.lineWidth = horRes;
				ctx.stroke();
			}
		}
		//#endregion

		ray.a += (fov/view.width)*horRes*DR;
		if(ray.a < 0)
			ray.a += TAU;
		if(ray.a > TAU)
			ray.a -= TAU;
	}
}