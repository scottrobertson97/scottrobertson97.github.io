"use strict";

window.onload = init;

//game
let lastTime = 0; // used by calculateDeltaTime()
let dt = 0;

//canvas stuff
const c = document.getElementById("view");
const ctx = c.getContext("2d");
ctx.imageSmoothingEnabled = false;

var offscreen = new OffscreenCanvas(c.width, c.height);
var off_ctx = offscreen.getContext("2d");

//canvas stuff
const map_c = document.getElementById("map");
const map_ctx = map_c.getContext("2d");
map_ctx.imageSmoothingEnabled = false;

//cosntants
const TAU = Math.PI * 2;
const P2 = Math.PI / 2;
const P3 = 3 * Math.PI / 2;
const DR = Math.PI / 180; // one degree in radians
const DOF = 64;

//view stuff
const view = {
	_halfHeight: c.height/2,
	get width() {
		return c.width;
	} ,
	get height() {
		return c.height;
	},
	get halfHeight() {
		return this._halfHeight;
	}
};
const fov = 75;
let horRes = 8; //horizontal resolution, higher number = less resolution
let halfHorRes = horRes/2;
let drawRays = true;
function updateHorRes(num){
	horRes = num;
	halfHorRes = horRes/2;
}

//#region wall texture stuff
const walls = [];
const walls_img = [];
walls[0] = [];
walls[1] = ['#FF0000', '#FF0000', '#FF0000', '#FF0000',];
//#endregion

//#region texture loading
let img = new Image();
img.src = 'https://i.imgur.com/W8PJYFY.png';
img.setAttribute('crossOrigin', '');
const img_ctx = document.getElementById('imageCanvas').getContext('2d');
walls[2] = img_ctx.createImageData(16, 16);

img.onload = () => {
	img_ctx.drawImage(img, 0, 0);
	img.style.display = 'none';
	walls[2] = img_ctx.getImageData(0,0,16,16);
	//walls[2].img = img;
	walls_img[2] = img;
	imagesLoaded = true;
};
let imagesLoaded = true;
//#endregion

//#region map
let map = [
	[1,2,2,2,2,1,1,1],
	[1,0,2,0,0,2,1,1],
	[1,0,2,0,0,0,1,1],
	[1,0,0,0,0,0,0,1],
	[1,0,0,0,0,0,0,1],
	[1,0,0,0,0,2,0,1],
	[1,0,0,0,0,0,0,1],
	[1,0,2,0,0,2,1,1],
	[1,0,2,0,0,0,1,1],
	[1,0,0,0,0,0,0,1],
	[1,0,0,0,0,0,0,1],
	[1,0,0,0,0,2,0,1],
	[1,0,0,0,0,0,0,1],
	[1,1,1,1,1,1,1,1]
];

Object.defineProperty(map, 'x', {
	get: function() { return this.width; }
});
Object.defineProperty(map, 'width', {
	get: function() { return this[0].length; }
});
Object.defineProperty(map, 'y', {
	get: function() { return this.height; }
});
Object.defineProperty(map, 'height', {
	get: function() { return this.length; }
});
Object.defineProperty(map, 's', {
	get: function() { return this.size; }
});
Object.defineProperty(map, 'size', {
	get: function() { return 64; }
});
map.img = null;
map.draw = () => {
	if(map.img == null){
		let color = 'white';
		for(let y = 0; y < map.height; y++){
			for(let x = 0; x < map.width; x++){

				let xo = x*map.size;
				let yo = y*map.size;
				let i = map[y][x];

				if(i==1) {
					map_ctx.fillStyle = 'white';
					map_ctx.fillRect(xo+1, yo+1, map.s-1, map.s-1);
				}
				else if(i > 0) {
					map_ctx.drawImage(walls_img[i], xo, yo, 64, 64);
				}
				else{
					map_ctx.fillStyle = 'black';
					map_ctx.fillRect(xo+1, yo+1, map.s-1, map.s-1);
				}					

				
			}
		}
		map.img = map_ctx.getImageData(0,0,512,512);
	} else {
		map_ctx.putImageData(map.img, 0, 0);
	}
};
map.setTile = (x, y, i) => {	
	map[y][x]=i;
	map.img = null;
};
//#endregion

const myKeys = new Keyboard();

const player = new Player(300,300);

function init() {
	update();
}

function update() {
	requestAnimationFrame(update);
	dt = calculateDeltaTime();
	player.update(dt, myKeys);
	draw();
	//requestAnimationFrame(update);
}

function draw() {
	if(imagesLoaded){
		//ctx.fillStyle = 'gray';
		//ctx.fillRect(0, 0, 1024, 512);
		map.draw();
		
		drawRays2D();
		player.draw(map_ctx);
	}
}

function dist( ax, ay, bx, by, ang){	
	return (Math.sqrt(Math.pow((bx-ax), 2) + Math.pow((by-ay), 2)));
}

function drawRays2D() {
	ctx.fillStyle = '#333';
	ctx.fillRect(0,0,view.width,view.halfHeight);
	ctx.fillStyle = 'gray';
	ctx.fillRect(0,view.halfHeight,view.width,view.halfHeight);

	let colorMod = 1;

	let ray = {x:0, y:0, a:0};
	//map x, map y, map pos, depth of field, x offset, y offset, final distance
	let mx, my, mp, dof, xo, yo, disT;

	ray.a = player.a - DR*(fov/2);
	if(ray.a < 0)
		ray.a += TAU;
	if(ray.a > TAU)
		ray.a -= TAU;

	let lastImg, pixelIndex, heightFraction;
	let currImg = {};

	for(let r = 0; r < view.width/horRes; r++) {
		//#region other
		let isVertical, isLeft, isUp;
		let mpv={x:1,y:0};
		let mph={x:0,y:0};
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
			dof = DOF;
		}
		while(dof < DOF) {
			mx = Math.trunc(ray.x)>>6;
			my = Math.trunc(ray.y)>>6;
			//mp = my * map.width + mx;
			if(mx < map.width && mx >= 0 && my >= 0 && my < map.height && map[my][mx] > 0) { //hit wall
				hx = ray.x;
				hy = ray.y;
				disH = dist(player.x, player.y, hx, hy, ray.a);
				mph.x =mx; mph.y = my;
				//mph = mp;
				dof = DOF;
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
			dof = DOF;
		}
		while(dof < DOF) {
			mx = Math.trunc(ray.x)>>6;
			my = Math.trunc(ray.y)>>6;
			if( mx >= 0 && my >= 0 && mx < map.width && my < map.height && map[my][mx] > 0) { //hit wall
				vx = ray.x;
				vy = ray.y;
				disV = dist(player.x, player.y, vx, vy, ray.a);
				mpv.x = mx;
				mpv.y = my;
				dof = DOF; 
			}
			else {
				ray.x += xo;
				ray.y += yo;
				dof +=1 ;
			}
		}
		//#endregion
		
		//#region  vertical or horizontal
		if(disV <= disH) {
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

		//#region Draw 3D Walls
		let ca = player.a - ray.a;
		if(ca < 0)
			ca += TAU;
		if(ca > TAU)
			ca -= TAU;

		//if(disT > DOF * map.size)
			//continue;

		disT *= Math.cos(ca);//fix fisheye
		

		let lineH = Math.trunc((map.s*view.height)/disT); //line height		

		//if(!mp || !lineH || !dof ){
		//	continue;
		//}

		//#region draw 2d
		if(drawRays){
			map_ctx.beginPath();
			map_ctx.moveTo(player.x, player.y);
			map_ctx.lineTo(ray.x, ray.y);
			map_ctx.strokeStyle = 'red';
			map_ctx.lineWidth = 1;
			map_ctx.stroke();
		}
		//#endregion

		let lineO = view.halfHeight - lineH/2; //line offset
		
		let x = mp.x;
		let y = mp.y;
		if(map[y][x] == 1) {
			ctx.beginPath();
			ctx.moveTo(r*horRes +  halfHorRes , lineO);
			ctx.lineTo(r*horRes +  halfHorRes, lineH + lineO);
			ctx.strokeStyle = `rgb(${(lineH/view.height) * 256 * colorMod},0,0)`;
			ctx.lineWidth = horRes;
			ctx.stroke();
		} else if(map[y][x] > 0 && walls[map[y][x]] != null) {
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

			if(map[y][x] != lastImg){
				lastImg = map[y][x];
			}

			let pixelX = Math.trunc(walls[lastImg].width * percentage);			
			
			ctx.drawImage(walls_img[lastImg], pixelX, 0, 1, walls[lastImg].height, r*horRes, lineO, horRes, lineH);

			ctx.globalAlpha = 1-((Math.min(lineH, view.height)/view.height) * colorMod);
			ctx.fillStyle = 'black';
    		ctx.fillRect(r*horRes, lineO, horRes, lineH);
    		ctx.globalAlpha = 1.0;
		}
		//#endregion

		ray.a += (fov/view.width)*horRes*DR;
		if(ray.a < 0)
			ray.a += TAU;
		if(ray.a > TAU)
			ray.a -= TAU;
	}
}

function calculateDeltaTime() {
	let now = performance.now();
	let lt = lastTime;
	lastTime = now;
	return (now - lt)/1000;
}