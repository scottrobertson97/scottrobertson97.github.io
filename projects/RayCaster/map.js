class Map extends Array {
	constructor(m) {
		super(...m);
		this.width = this[0].length;
		this.height = this.length;
		this.img = null;
	}	

	setTile(x, y, i) {
		this[y][x]=i;
		this.img = null;
	}

	draw(ctx,c) {
		if(this.img == null){
			ctx.fillStyle = 'gray';
			ctx.fillRect(0, 0, c.width, c.height);
			for(let y = 0; y < this.height; y++){
				for(let x = 0; x < this.width; x++){
	
					let xo = x*Map.size;
					let yo = y*Map.size;
					let i = this[y][x];
	
					if(i > 0) {
						ctx.drawImage(walls[i], xo, yo, Map.size, Map.size);
					}
					else{
						ctx.fillStyle = 'black';
						ctx.fillRect(xo+1, yo+1, Map.size-1, Map.size-1);
					}				
				}
			}
			this.img = ctx.getImageData(0, 0, c.width, c.height);
		} else {
			ctx.putImageData(this.img, 0, 0);
		}
	}

	static get size () {
		return 64;
	}
}
