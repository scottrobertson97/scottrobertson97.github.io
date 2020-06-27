"use strict";

window.onload = init;

//game
let lastTime = 0; // used by calculateDeltaTime()
let dt = 0;
let enemy = {
	x: 200,
	y: 300,
	size: 11.5,
	src: 'https://i.imgur.com/FcIXhVp.png',
	drawn: false,
	draw(ctx) {
		ctx.beginPath();
		ctx.moveTo(enemy.x - enemy.size, enemy.y - enemy.size);		
		ctx.lineTo(enemy.x + enemy.size, enemy.y - enemy.size);
		ctx.lineTo(enemy.x + enemy.size, enemy.y + enemy.size);
		ctx.lineTo(enemy.x - enemy.size, enemy.y + enemy.size);
		ctx.lineTo(enemy.x - enemy.size, enemy.y - enemy.size);
		ctx.strokeStyle = 'green';
		ctx.lineWidth = 1;
		ctx.stroke();
		//ctx.fillStyle = 'green';
		//ctx.fillRect(this.x-this.size, this.y-this.size, this.size*2, this.size*2);
	}	
}
enemy.img = new Image();
enemy.img.src = enemy.src;
enemy.img.setAttribute('crossOrigin', '');

//#region canvas
const c = document.getElementById("view");
const ctx = c.getContext("2d");
ctx.imageSmoothingEnabled = false;

var offscreen = new OffscreenCanvas(c.width, c.height);
var off_ctx = offscreen.getContext("2d");


const map_c = document.getElementById("map");
const map_ctx = map_c.getContext("2d");
map_ctx.imageSmoothingEnabled = false;
//#endregion

//#region constants
const TAU = Math.PI * 2;
const P2 = Math.PI / 2;
const P3 = 3 * Math.PI / 2;
const DR = Math.PI / 180; // one degree in radians
const DOF = 64;
//#endregion

//#region view
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
let fov = 75;
let horRes = 8; //horizontal resolution, higher number = less resolution
let halfHorRes = horRes/2;
let drawRays = true;
function updateHorRes(num){
	horRes = num;
	halfHorRes = horRes/2;
}
//#endregion

//#region wall texture stuff
const walls = [];
const imgSrcs = ['','https://i.imgur.com/W8PJYFY.png','https://i.imgur.com/pRpAqeP.png'];
imgSrcs.forEach((src, i) => {
	walls[i] = new Image();
	walls[i].src = src;
	walls[i].setAttribute('crossOrigin', '');
});
//#endregion

//#region map
let map = [
	[1,2,2,2,2,1,1,1,1,1,1],
	[1,0,2,0,0,2,1,0,0,0,2],
	[1,0,2,0,0,0,2,0,0,0,2],
	[1,0,0,0,0,0,0,0,0,0,2],
	[1,0,0,0,0,0,0,0,0,0,2],
	[1,0,0,0,0,2,0,0,0,0,2],
	[1,0,0,0,0,0,0,0,0,0,2],
	[1,0,2,0,0,2,1,0,0,0,2],
	[1,0,2,0,0,0,1,0,0,0,2],
	[1,0,0,0,0,0,0,0,0,0,2],
	[1,0,0,0,0,0,0,0,0,0,2],
	[1,0,0,0,0,2,0,0,0,0,2],
	[1,0,0,0,0,0,0,0,0,0,2],
	[1,1,1,1,1,1,1,1,1,1,1]
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
		map_ctx.fillStyle = 'gray';
		map_ctx.fillRect(0, 0, map_c.width, map_c.height);
		for(let y = 0; y < map.height; y++){
			for(let x = 0; x < map.width; x++){

				let xo = x*map.size;
				let yo = y*map.size;
				let i = map[y][x];

				if(i > 0) {
					map_ctx.drawImage(walls[i], xo, yo, 64, 64);
				}
				else{
					map_ctx.fillStyle = 'black';
					map_ctx.fillRect(xo+1, yo+1, map.s-1, map.s-1);
				}				
			}
		}
		map.img = map_ctx.getImageData(0, 0, map_c.width, map_c.height);
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
	document.querySelectorAll('input[type=radio][name="quality"]').forEach(r => {
		r.addEventListener("change", changeQualityHandler);
	});
	updateHorRes(8);

	map_c.width = map[0].length * 64;
	map_c.height = map.length * 64;
	update();
}

function update() {	
	dt = calculateDeltaTime();
	player.update(dt, myKeys, map);
	draw();
	requestAnimationFrame(update);
}

function draw() {
	map.draw();		
	drawRays2D();
	player.draw(map_ctx);
	enemy.draw(map_ctx);
}

function dist( ax, ay, bx, by){	
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

	enemy.drawn = false;

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
				disH = dist(player.x, player.y, hx, hy);
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
				disV = dist(player.x, player.y, vx, vy);
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
			colorMod = 0.7;
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

		let lineO = view.halfHeight - Math.trunc(lineH/2); //line offset
		
		let x = mp.x;
		let y = mp.y;
		/*if(map[y][x] == 1) {
			ctx.beginPath();
			ctx.moveTo(r*horRes +  halfHorRes , lineO);
			ctx.lineTo(r*horRes +  halfHorRes, lineH + lineO);
			ctx.strokeStyle = `rgb(${Math.min((Math.min(lineH, view.height)/view.height)+0.2, 1) * 200 * colorMod},0,0)`;
			ctx.lineWidth = horRes;
			ctx.stroke();
		} else*/ if(map[y][x] > 0 && walls[map[y][x]] != null) {
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
			
			ctx.drawImage(walls[lastImg], pixelX, 0, 1, walls[lastImg].height, r*horRes, lineO, horRes, lineH);

			ctx.globalAlpha = 1-(Math.min((Math.min(lineH, view.height)/view.height)+0.3, 1) * colorMod);
			ctx.fillStyle = 'black';
    		ctx.fillRect(r*horRes, lineO, horRes, lineH);
    		ctx.globalAlpha = 1.0;
		}
		//#endregion

		//#region enemies
		let rls = {x1:ray.x, y1:ray.y, x2:player.x, y2:player.y}; //ray line segment
		let els1 = {x1:enemy.x - enemy.size,y1:enemy.y - enemy.size,x2:enemy.x + enemy.size,y2:enemy.y + enemy.size}; //enemy line segment 1
		let els2 = {
			x1:enemy.x + enemy.size,
			y1:enemy.y - enemy.size,
			x2:enemy.x - enemy.size,
			y2:enemy.y + enemy.size
		};
		if(!enemy.drawn && (lineIntersect(rls, els1) || lineIntersect(rls, els2))) {
			{				
				map_ctx.beginPath();
				map_ctx.moveTo(ray.x, ray.y);
				map_ctx.lineTo(player.x, player.y);	
				map_ctx.strokeStyle = 'pink';
				map_ctx.stroke();
			}		
			enemy.drawn = true;
		}
		//#endregion

		ray.a += (fov/view.width)*horRes*DR;
		if(ray.a < 0)
			ray.a += TAU;
		if(ray.a > TAU)
			ray.a -= TAU;
	}

	//#region draw enemy
	if(enemy.drawn){		
		let disT= dist(player.x, player.y, enemy.x, enemy.y);

		let minT = player.a - (fov/2)* (Math.PI/180);
		let maxT = player.a + (fov/2)* (Math.PI/180);
		let wideMinT = minT - 0.3;
		let wideMaxT = maxT + 0.3;
		let x = enemy.x - player.x;
		let y = enemy.y - player.y;
		let length = dist(0,0,x,y);
		x = x/length;
		y = y/length;
		let t = 0;
		if(y>0 && x>0) {
			t = Math.atan(y/x);
		}else if(y>0 && x<0){
			t = Math.atan(y/x)+Math.PI;
		}else if(y<0 && x<0){
			t = Math.atan(y/x)+Math.PI;
		}else if(y<0 && x>0){
			t = Math.atan(y/x)+Math.PI+Math.PI;	
		}
		if(t > Math.PI*2)
			t-=Math.PI*2;
		if(t<0)
			t+=Math.PI*2
			
		let ca = player.a - t;
		if(ca < 0)
			ca += TAU;
		if(ca > TAU)
			ca -= TAU;
		disT *= Math.cos(ca);//fix fisheye	

		let lineH = Math.trunc((map.s*view.height)/disT);
		let lineO = view.halfHeight - Math.trunc(lineH/2); //line offset
		
		map_ctx.strokeStyle = 'blue';
		map_ctx.lineWidth = 5;
		map_ctx.beginPath();
		map_ctx.moveTo(enemy.x + enemy.size, enemy.y - enemy.size);
		map_ctx.lineTo(enemy.x - enemy.size, enemy.y + enemy.size);	
		map_ctx.stroke();
		map_ctx.beginPath();
		map_ctx.moveTo(enemy.x - enemy.size, enemy.y - enemy.size);
		map_ctx.lineTo(enemy.x + enemy.size, enemy.y + enemy.size);	
		map_ctx.stroke();

		map_ctx.beginPath();
		map_ctx.moveTo(player.x, player.y);
		map_ctx.lineTo(enemy.x, enemy.y);
		map_ctx.strokeStyle = 'green';
		map_ctx.lineWidth = 5;
		map_ctx.stroke();

		


		//if(t > minT-0.3 && t < maxT+0.3){
			
			let width = (lineH/enemy.img.height) * (enemy.size*2)/*enemy.img.width*/;
			let percent = (t-minT) / (maxT-minT);
			if(t > wideMaxT){
				percent = (t - (minT + (Math.PI*2))) / (maxT-minT);
			} else if(t < wideMinT){
				percent = ((t+(Math.PI*2)) - minT) / (maxT-minT);
			}
			let CX = (percent)*view.width;
			ctx.drawImage(enemy.img, CX-width/2, lineO, width, lineH);
		//}
		
		
			t *= (180/Math.PI);
			minT*= (180/Math.PI);
			maxT*= (180/Math.PI);
		a = {t, minT, maxT};
		
	}
	//#endregion
}
let a;

function calculateDeltaTime() {
	let now = performance.now();
	let lt = lastTime;
	lastTime = now;
	return (now - lt)/1000;
}

function changeQualityHandler(e) {
	updateHorRes(e.target.value);
}