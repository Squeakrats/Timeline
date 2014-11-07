var CANVAS_WIDTH = 900, CANVAS_HEIGHT = 400, NUM_CIRCLES = 100, BLUR_FACTOR = 1;


var vec2 = function (x, y) { this.x = x; this.y = y; }
	vec2.prototype.clone = function () { return new vec2(this.x, this.y); }
	vec2.prototype.add = function (b) { this.x += b.x; this.y += b.y; return this; }
	vec2.prototype.scale = function (s){ this.x *= s; this.y *= s; return this; }
	vec2.prototype.length = function () { var x = this.x, y = this.y; return Math.sqrt(x * x + y * y); }


function Circle (px, py, vx, vy) {
	this.position = new vec2(px, py);
	this.velocity = new vec2(vx, vy);
	this.radius = 10;
	this.color = "" + Math.floor(Math.random() * 255) + "," + Math.floor(Math.random() * 255)  + "," + Math.floor(Math.random() * 255);
}

var activeCircles = [];

for(var i = 0; i < NUM_CIRCLES;i++){
	var vx = (Math.random() - .5) * 20;
	var vy = (Math.random() - .9) * 20;
	activeCircles.push(new Circle(CANVAS_WIDTH/2,CANVAS_HEIGHT/2, vx, vy));
}

function Draw(ctx, timeMs) {
	var numTicks = Math.floor(timeMs/17);
	if(numTicks == 0){
		activeCircles.forEach(function(circle){
			ctx.fillStyle = "rgba(" + circle.color + "," + .08  + ")";
			ctx.beginPath();
			ctx.arc(circle.position.x, circle.position.y, circle.radius, 0, Math.PI*2);
			ctx.closePath();
			ctx.fill();
		})
	}
	//console.log(numTicks)
	activeCircles.forEach(function(circle){
		var pos = circle.position.clone();
		var vel = circle.velocity.clone();
		var accel = new vec2(0, .3);
		for(var i = 0; i < numTicks;i++){
			pos.add(vel);
			vel.add(accel).scale(.9999999);
			if(pos.x < 0 && vel.x < 0){
				vel.x *= -.9;
			}
			if(pos.x > CANVAS_WIDTH && vel.x > 0){
				vel.x *= -.9;
			}
			if(pos.y < 0 && vel.y < 0){
				vel.y *= -.9;
			}
			if(pos.y >  CANVAS_HEIGHT && vel.y > 0){
				vel.y *= -.8;
				vel.x *= .9;
			}

			
			if(numTicks - i <= BLUR_FACTOR){
				if(i % 2 == 0 || i == numTicks - 1){
					var alpha = .6 - (numTicks - 1 - i)/15;
					ctx.fillStyle = "rgba(" + circle.color + "," + alpha  + ")";
					ctx.beginPath();
					ctx.arc(pos.x, pos.y, circle.radius, 0, Math.PI*2);
					ctx.closePath();
					ctx.fill();
				}
				
			}
			
		}
		
	})
}