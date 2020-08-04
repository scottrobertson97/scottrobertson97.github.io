class Entity {
	constructor (x, y, size, src){
		this.x = x;
		this.y = y;
		this.size = size;
		this.drwan = false;
		this.img = new Image();
		this.img.src = src;
		this.img.setAttribute('crossOrigin', '');
	}
	
	draw(player, ctx, map_ctx, view){
		let disT= dist(player.x, player.y, this.x, this.y);
	
		let minT = player.a - (fov/2)* (Math.PI/180);
		let maxT = player.a + (fov/2)* (Math.PI/180);
		let wideMinT = minT - 0.3;
		let wideMaxT = maxT + 0.3;
		let x = this.x - player.x;
		let y = this.y - player.y;
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
	
		let lineH = Math.trunc((Map.size*view.height)/disT);
		let lineO = view.halfHeight - Math.trunc(lineH/2); //line offset
		
		//#region draw lines
		map_ctx.strokeStyle = 'blue';
		map_ctx.lineWidth = 5;
		map_ctx.beginPath();
		map_ctx.moveTo(this.x + this.size, this.y - this.size);
		map_ctx.lineTo(this.x - this.size, this.y + this.size);	
		map_ctx.stroke();
		map_ctx.beginPath();
		map_ctx.moveTo(this.x - this.size, this.y - this.size);
		map_ctx.lineTo(this.x + this.size, this.y + this.size);	
		map_ctx.stroke();
		map_ctx.beginPath();
		map_ctx.moveTo(player.x, player.y);
		map_ctx.lineTo(this.x, this.y);
		map_ctx.strokeStyle = 'green';
		map_ctx.lineWidth = 5;
		map_ctx.stroke();
		//#endregion
	
		let width = (lineH/this.img.height) * (this.size*2)/*this.img.width*/;
		let percent = (t-minT) / (maxT-minT);
		if(t > wideMaxT){
			percent = (t - (minT + (Math.PI*2))) / (maxT-minT);
		} else if(t < wideMinT){
			percent = ((t+(Math.PI*2)) - minT) / (maxT-minT);
		}
		let CX = (percent)*view.width;
		ctx.drawImage(this.img, CX-width/2, lineO, width, lineH);
		
				t *= (180/Math.PI);
		minT*= (180/Math.PI);
		maxT*= (180/Math.PI);
		a = {t, minT, maxT};
	}	

	draw2D(ctx){
		ctx.beginPath();
		ctx.moveTo(this.x - this.size, this.y - this.size);		
		ctx.lineTo(this.x + this.size, this.y - this.size);
		ctx.lineTo(this.x + this.size, this.y + this.size);
		ctx.lineTo(this.x - this.size, this.y + this.size);
		ctx.lineTo(this.x - this.size, this.y - this.size);
		ctx.strokeStyle = 'green';
		ctx.lineWidth = 1;
		ctx.stroke();
	}
}