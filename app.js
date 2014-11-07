console.log("weee") //wtf why is mah z-indices not working T_T


window.onload = function () {
	var canvas = document.createElement("canvas");
		canvas.width =  CANVAS_WIDTH;
		canvas.height =  CANVAS_HEIGHT;
	document.body.appendChild(canvas);
	var ctx = canvas.getContext('2d');
	ctx.fillStyle="rgb(0,0,0)";
	ctx.fillRect(0,0,CANVAS_WIDTH,CANVAS_HEIGHT);


	var timeline = new Timeline(0, 10000);
	document.body.appendChild(timeline.bodyElem);

	//possible interval leaks going on
	timeline.addAnimation("default", new Animation("PARTICLES", 0, 10000, 5000, 10000) ); 
	timeline.addAnimation("moar", new Animation("PARTICLES", 0, 10000, 5000, 10000) );

	timeline.on('tick', function (e) {
		ctx.fillStyle="rgb(0,0,0)";
		ctx.fillRect(0,0,CANVAS_WIDTH,CANVAS_HEIGHT);
		if(e.default.PARTICLES.timeU >= 0 && e.default.PARTICLES.timeU <= 1){ //T is not 
			Draw(ctx, e.default.PARTICLES.time);
		}
		if(e.moar.PARTICLES.timeU >= 0 && e.moar.PARTICLES.timeU <= 1){ //T is not 
			Draw(ctx, e.moar.PARTICLES.time);
		}
		
	})
}
