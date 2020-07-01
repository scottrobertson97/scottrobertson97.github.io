class Player {
	constructor(x = 0, y = 0, a = 0, speed = 200, lookSpeed = 2) {
		this.x = x;
		this.y = y;
		this.a = a;
		this.speed = speed;
		this.lookSpeed = lookSpeed;
		this.ctx = ctx;
		this.dx = Math.cos(this.a) * this.speed * 0.016;
		this.dy = Math.sin(this.a) * this.speed * 0.016;
	}

	update(dt, kb, map) {
		if(kb.keydown[Keyboard.KEYBOARD.KEY_RIGHT] || kb.keydown[Keyboard.KEYBOARD.KEY_D]){
			this.a += this.lookSpeed * dt;
			if(this.a > TAU ) this.a -= TAU;
			this.dx = Math.cos(this.a) * this.speed * dt;
			this.dy = Math.sin(this.a) * this.speed * dt;
		}
		if(kb.keydown[Keyboard.KEYBOARD.KEY_LEFT] || kb.keydown[Keyboard.KEYBOARD.KEY_A]){
			this.a -= this.lookSpeed * dt;
			if(this.a < 0 ) this.a += TAU;
			this.dx = Math.cos(this.a) * this.speed * dt;
			this.dy = Math.sin(this.a) * this.speed * dt;
		}
		if(kb.keydown[Keyboard.KEYBOARD.KEY_UP] || kb.keydown[Keyboard.KEYBOARD.KEY_W]){
			let oldX = Math.trunc(this.x)>>6;
			let oldY = Math.trunc(this.y)>>6;
			this.x += this.dx;
			this.y += this.dy;
			let newX = Math.trunc(this.x)>>6;
			let newY = Math.trunc(this.y)>>6;
			if(map[newY][newX] > 0){
				if(newX != oldX){
					this.x -= this.dx;
				}
				if(newY != oldY) {
					this.y -= this.dy;
				}
				if(newX != oldX && newY != oldY){					
					if(map[oldY][newX] == 0){
						this.x += this.dx;
					}
					if(map[newY][oldX] == 0){
						this.y += this.dy;
					}
				} 
			}		
		}
		if(kb.keydown[Keyboard.KEYBOARD.KEY_DOWN] || kb.keydown[Keyboard.KEYBOARD.KEY_S]){
			let oldX = Math.trunc(this.x)>>6;
			let oldY = Math.trunc(this.y)>>6;
			this.x -= this.dx;
			this.y -= this.dy;
			let newX = Math.trunc(this.x)>>6;
			let newY = Math.trunc(this.y)>>6;
			if(map[newY][newX] > 0){
				if(newX != oldX){
					this.x += this.dx;
				}
				if(newY != oldY) {
					this.y += this.dy;
				}
				if(newX != oldX && newY != oldY){					
					if(map[oldY][newX] == 0){
						this.x -= this.dx;
					}
					if(map[newY][oldX] == 0){
						this.y -= this.dy;
					}
				} 
			}	
		}
	}

	draw(ctx) {
		ctx.fillStyle = 'yellow';
		ctx.fillRect(this.x-10, this.y-10, 20, 20);
		ctx.beginPath();
		ctx.moveTo(this.x, this.y);
		ctx.lineTo(this.x + this.dx * 20, this.y + this.dy * 20);
		ctx.strokeStyle = 'yellow';
		ctx.lineWidth = 1;
		ctx.stroke();
	}
}
