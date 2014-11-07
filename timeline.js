var Timeline, Animation;
(function(){
	'use-strict'

	var createTimelineDOMObject = function (timeline) {
		var root = document.createElement("div");
			root.className = "timelinejs-root"
			root.innerHTML = "<div class='timelinejs-menu'><div class='timelinejs-controls'><input class = 'timelinejs-control timelinejs-speed' value='1' /><div class='timelinejs-control timelinejs-play'></div><div class='timelinejs-control timelinejs-loop'></div></div><div class='timelinejs-timeline'><div class='timelinejs-time-marker'><input type = 'text' value = '0'><div class='timelinejs-vertical-time-marker'></div></div></div></div><div class='timelinejs-display'><div class='timelinejs-details'></div><div class='timelinejs-popup'><div> Local Time </div><div><input></div><div> Global Time </div><div><input></div></div></div>";
		
		var root  = $(root),
			menuElem  = root.find(".timelinejs-menu"),
			speedElem = root.find(".timelinejs-speed"),
			playElem  = root.find(".timelinejs-play"),
			loopElem  = root.find(".timelinejs-loop"),
			timeMarkerElem = root.find(".timelinejs-time-marker"),
			timeMarkerInputElem = timeMarkerElem.find("input"),
			timelineElem = root.find(".timelinejs-timeline"),
			details = root.find(".timelinejs-details"),
			popupElem = root.find(".timelinejs-popup");

			popupElem.on('click mousedown', function (e) { e.stopPropagation(); })
			timeMarkerInputElem.on('click mousedown', function (e) { e.stopPropagation(); })

			timeMarkerInputElem.keypress(function(e){
				if(e.keyCode != 13) return;
				var time = parseFloat($(this).val());
				if(!isNaN(time)) timeline.setTimeUnsafe(time);
			})

			playElem.on("click", function (e) {
				(!timeline.isPlaying())? timeline.play() : timeline.pause();
			})

			loopElem.on("click", function (e) {
				timeline.toggleLooping();
			})

			speedElem.on("input", function (e) {
				timeline.setSpeed(parseFloat($(this).val()));
			})

			var range = timeline.getRange();
			var interval = null, mouseTime = 0, timelineWidth = 700; //MORE HARD CODED SP00kY SCARY SKELETONS
			function onMouseMove(e){
				mouseTime = range.timeStart + (e.pageX - timelineElem.offset().left ) / timelineWidth * range.width ;
				if(mouseTime < range.timeStart) mouseTime = range.timeStart;
				if(mouseTime > range.timeEnd)   mouseTime = range.timeEnd;
			}

			timelineElem.on("mousedown", function (e) {
				if(timeline.isPlaying()) timeline.pause();
				clearInterval(interval);
				var lastTime = null;
				interval = setInterval(function() {
					if(lastTime != mouseTime){
						if(timeline.isPlaying()) self.pause();
						lastTime = mouseTime;
						timeline.setTimeUnsafe(mouseTime);
					}
				}, 17);
				onMouseMove(e);
				timeline.setTimeUnsafe(mouseTime);
				timeline.setLoopTime(mouseTime);
				root.on("mousemove", onMouseMove);
			});

			root.on("mouseup", function (e) {
				clearInterval(interval);
				root.off("mousemove");
			});

			root.mouseleave(function(e){
				clearInterval(interval);
				root.off("mousemove");
			});

		return root[0];
	}

	Animation = function (name, ts, te, gs, ge) {
		this.name = name;
		this.range = new TimeInterval(ts, te);
		this.globalRange = new TimeInterval(gs, ge);

		this.time = null
		this.timeU = null;
	}

	var TimeInterval = function (ts, te) {
		this.timeStart = ts;
		this.timeEnd = te;
		this.width = te - ts;

		this.setStart = function (s) {
			this.timeStart = s;
			this.width = this.timeEnd - s;
		}

		this.setEnd = function (e) {
			this.timeEnd = e;
			this.width = e - this.timeStart;
		}

		this.setRange = function (s, e) {
			this.timeStart = s;
			this.timeEnd = e;
			this.width = e - s;
		}

	}

	Timeline = function (ts, te) {
		var self = this;
		this.range = new TimeInterval(ts, te);
		this.mode = "aimationframe";
		this.bodyElem = undefined;
		var timelineElem, popupElem;
		var layers = {};

		var time = 0, timeU = 0, speed = 1, loopTime = 0, intervalTimeout = 17;
		var bIsPlaying = false, bIsLooping = false;

		var events = {}
		this.on = function (eventName, callback) {
			if(events[eventName] === undefined){
				events[eventName] = [];
			}
			events[eventName].push(callback);
		}

		this.off = function (eventName) { //add optional callback to remove specific callback?!?!?!?! 3sp00ky5m3
			events[eventName] = [];
		}

		this.emit = function (eventName, data) {
			if(events[eventName] === undefined) events[eventName] = [];
			events[eventName].forEach(function(callback) {
				callback(data);
			});
		};

		this.addAnimation = function (layerName, animation) {
			if(layers[layerName] === undefined) {
				layers[layerName] = { "$$elem" : $("<div class = 'timelinejs-layer-container'><div class='timelinejs-layer-info'><div class='timelinejs-layer-title'><input type = 'text' value = '" +  layerName+ "'></div></div></div>") };
				$(self.bodyElem).find(".timelinejs-details").append(layers[layerName]["$$elem"]);
			};
			layers[layerName][animation.name] = animation;
			var elem = elem = $("<div class='timelinejs-animation'></div>")
			layers[layerName]["$$elem"].append(elem);


			var leftHandle = $("<div class='timelinejs-end-point left'></div>");
			var rightHandle = $("<div class='timelinejs-end-point right'></div>");
			elem.append(leftHandle);
			elem.append(rightHandle);
			
			//MORE HARD CODED 700s. SERIOUSLY REMOVE ALL OF THESE. 
			elem.css("transform", "translate3d(" +  (animation.globalRange.timeStart - this.range.timeStart) / this.range.width * 700 + "px,0px,0px)" )
			elem.css("width", animation.globalRange.width / this.range.width * 700);

			var mouseTime = null, mouseDownTime = null, mouseInterval = null;

			function onMouseMove(e){
				mouseTime = self.range.timeStart + (e.pageX - timelineElem.offset().left) / 700 * self.range.width;
				if(mouseTime < self.range.timeStart) mouseTime = self.range.timeStart;
				if(mouseTime > self.range.timeEnd)   mouseTime = self.range.timeEnd;
			}

			elem.on("mousedown", function (e) {
				clearInterval(mouseInterval)
				var last = time, startMouse = null, startMinRange = null;
				mouseInterval = setInterval(function () {
					if(mouseTime == null) return;
					if(Math.abs(mouseTime - startMouse) < 200) mouseTime = startMouse;
					if(last != mouseTime){
						last = mouseTime;
						var dt = mouseTime - startMouse;
						var left = Math.max(self.range.timeStart , (startMinRange + dt));
						animation.globalRange.setRange(left, left + animation.globalRange.width);
						elem.css("transform", "translate3d(" + (animation.globalRange.timeStart - self.range.timeStart)/self.range.width * 700 + "px,0px,0px)");
						self.setTimeUnsafe(time);
					}
				}, 17);

				onMouseMove(e);
				startMouse = mouseTime;
				startMinRange = animation.globalRange.timeStart;
				e.stopPropagation();
				popupElem.removeClass("open");
				$(self.bodyElem).on("mousemove", onMouseMove);
			})

			leftHandle.on("mousedown", function (e) {
				mouseDownTime = e.timeStamp;
				clearInterval(mouseInterval)
				var last = time;
				var startTime = animation.globalRange.timeStart;
				mouseInterval = setInterval(function () {
					if(mouseTime == null) return;
					if(Math.abs(mouseTime - startTime) < 200) mouseTime = startTime;
					if(last != mouseTime){
						last = mouseTime;
						if(mouseTime > animation.globalRange.timeEnd) mouseTime = animation.globalRange.timeEnd;
						animation.globalRange.setStart(mouseTime);
						elem.css("width", animation.globalRange.width / self.range.width * 700)
						elem.css("transform", "translate3d(" +  (animation.globalRange.timeStart - self.range.timeStart)/self.range.width * 700 + "px,0px,0px)");
						self.setTimeUnsafe(time);
					}
				}, 17);
				onMouseMove(e);
				e.stopPropagation();
				popupElem.removeClass("open");
				$(self.bodyElem).on("mousemove", onMouseMove);
			});

			leftHandle.on('click', function (e) {
				if(e.timeStamp - mouseDownTime < 100) self.setTimeUnsafe(animation.globalRange.timeStart);
				e.stopPropagation();
			});

			rightHandle.on("mousedown", function (e) {
				mouseDownTime = e.timeStamp;
				clearInterval(mouseInterval);
				var last = null;
				var startTime = animation.globalRange.timeEnd;
				mouseInterval = setInterval(function (e) {
					if(mouseTime == null) return;
					if(Math.abs(mouseTime - startTime) < 200) mouseTime = startTime;
					if(last != mouseTime){
						last = mouseTime;
						animation.globalRange.setEnd(mouseTime);
						elem.css("width", animation.globalRange.width / self.range.width * 700);
						self.setTimeUnsafe(time);
					}
				}, 17);
				onMouseMove(e);
				e.stopPropagation();
				$(self.bodyElem).on("mousemove", onMouseMove);
			});

			rightHandle.on('click', function (e) {
				if(e.timeStamp - mouseDownTime < 100) self.setTimeUnsafe(animation.globalRange.timeEnd);
				e.stopPropagation();
			});



			///////////////////////
			//$(self.bodyElem).append($(".popup"));
			leftHandle.attr("oncontextmenu", "return false");
			leftHandle.mousedown(function(e){
				if(e.which == 3){
					popupElem.addClass("open");
					var origin = $(self.bodyElem).offset();
					popupElem.css('left', e.pageX - origin.left - 50).css("top", e.pageY - origin.top - 100);
					var inputs = popupElem.find("input")
					inputs.off("keypress");
					$(inputs[0]).val(animation.range.timeStart);
					$(inputs[1]).val(animation.globalRange.timeStart);
					$(inputs[0]).keypress(function(e){
						if(e.keyCode != 13) return;
						var _time = parseFloat($(this).val());
						animation.range.setStart(_time);
						self.setTimeUnsafe(time)
					})

					$(inputs[1]).keypress(function(e){
						if(e.keyCode != 13) return;
						var _time = parseFloat($(this).val());
						if(!isNaN(_time)){
							if(_time > animation.globalRange.timeEnd) _time = animation.globalRange.timeEnd;
							animation.globalRange.setStart(_time);
							elem.css("width", animation.globalRange.width / self.range.width * 700)
							elem.css("transform", "translate3d(" +  (animation.globalRange.timeStart - self.range.timeStart)/self.range.width * 700 + "px,0px,0px)");
							self.setTimeUnsafe(time);
						}
					})


				}
			})

			rightHandle.attr("oncontextmenu", "return false");
			rightHandle.mousedown(function(e){
				if(e.which == 3){
					popupElem.addClass("open");
					var origin = $(self.bodyElem).offset();
					popupElem.css('left', e.pageX - origin.left - 50).css("top", e.pageY - origin.top - 100);
					var inputs = popupElem.find("input")
					inputs.off("keypress");
					$(inputs[0]).val(animation.range.timeEnd);
					$(inputs[1]).val(animation.globalRange.timeEnd);
					$(inputs[0]).keypress(function(e){
						if(e.keyCode != 13) return;
						var _time = parseFloat($(this).val());
						animation.range.setEnd(_time);
						self.setTimeUnsafe(time)
					})

					$(inputs[1]).keypress(function(e){
						if(e.keyCode != 13) return;
						var _time = parseFloat($(this).val());
						if(!isNaN(_time)){
							if(_time > self.range.timeEnd) _time = self.range.timeEnd;
							if(_time < animation.globalRange.timeStart) _time = animation.globalRange.timeStart;
							console.log(_time);
							animation.globalRange.setEnd(_time);
							elem.css("width", animation.globalRange.width / self.range.width * 700);
							self.setTimeUnsafe(time);
						}
					})


				}
			})


			$(self.bodyElem).on("mouseup", function (e) {
				clearInterval(mouseInterval);
				$(self.bodyElem).off("mousemove");

			});

			$(self.bodyElem).mouseleave(function(e){
				clearInterval(mouseInterval);
				$(self.bodyElem).off("mousemove");
			});

			$(self.bodyElem).on("click", function (e) {
				if(e.which != 3) {
					popupElem.removeClass("open");
				}
			})




		}

		this.isPlaying = function () { return bIsPlaying; };
		this.isLooping = function () { return bIsLooping; };
		this.getRange = function () { return this.range; }
		this.setSpeed = function (_speed) {
			speed = (!isNaN(_speed))? Math.min(_speed, 500) : 1;
		}
		this.setLoopTime = function (_loopTime) {
			loopTime = _loopTime;
		}
		this.toggleLooping = function () {
			if(!bIsLooping){
				bIsLooping = true;
				$(this.bodyElem).find(".timelinejs-loop").addClass("selected");
			}else{
				bIsLooping = false;
				$(this.bodyElem).find(".timelinejs-loop").removeClass("selected");
			}
		}

		//make the DOM active now :O
		this.bodyElem = createTimelineDOMObject(this);
		timelineElem = $(this.bodyElem).find(".timelinejs-timeline");
		popupElem = $(this.bodyElem).find(".timelinejs-popup");
		var timeMarkerElem = $(this.bodyElem).find(".timelinejs-time-marker");
		var timeMarkerInputElem = timeMarkerElem.find("input");
		var timelineElemWidth = 700; // HARD CODED 700 RIGHT HERE. YEA THATS RIGHT BE VERY AFRAID. DO NOT LOSE THIS. SERIOUSLY ITS RIGHT HERE. HARDCODED. YEP 
		this.setTimeUnsafe = function (_time) {

			if(_time < this.range.timeStart){
				time = this.range.timeStart;
				bIsPlaying = false;
			}else if(_time > this.range.timeEnd){
				time = this.range.timeEnd;
				bIsPlaying = false;
			}else{
				time = _time
			}

			timeU = (time - this.range.timeStart) / this.range.width;

			for(var layerName in layers) {
				for(var animationName in layers[layerName]) {
					if(animationName != "$$elem"){
						var anim = layers[layerName][animationName];
						var ratio = anim.range.width / anim.globalRange.width;
						anim.time = anim.range.timeStart + (time - anim.globalRange.timeStart) * ratio;
						anim.timeU = (anim.time - anim.range.timeStart) / anim.range.width;
					}
					
				}
			}

			timeMarkerInputElem.val(time);
			timeMarkerElem.css("transform", "translate3d(" + (time - self.range.timeStart) / self.range.width * timelineElemWidth + "px,0px,0px)");
			self.emit("tick", layers);
		}

		var playInterval;
		var animStartTimeHR = null;
		var animStartTime = null;
		function animationFrameCallback(_time) {
			if(!bIsPlaying) return;
			if(animStartTimeHR == null){
				animStartTimeHR = _time;
				animStartTime = time;
			}
			self.setTimeUnsafe(animStartTime + speed * (_time - animStartTimeHR));

			if(bIsPlaying){
				requestAnimationFrame(animationFrameCallback)
			}else {
				self.setTimeUnsafe(loopTime);
				if(bIsLooping){
					self.play();
				}
			}
		}

		this.play = function () {
			bIsPlaying = true;
			$(this.bodyElem).find(".timelinejs-play").addClass("selected");

			if(this.mode == "interval"){
				var last = new Date().getTime();
				clearInterval(playInterval);
				playInterval = setInterval(function() {
					var now = new Date().getTime();
					var dt = now - last;
					last = now;
					self.setTimeUnsafe(time + speed * dt);
					if(!bIsPlaying){
						clearInterval(playInterval);
						self.setTimeUnsafe(mLoopTime);
						if(bIsLooping){
							self.play();
						}
					}
				}, intervalTimeout);
				self.setTimeUnsafe(time);
			}else{
				animStartTimeHR = null;
				requestAnimationFrame(animationFrameCallback);
			}
		}

		this.pause = function () {
			bIsPlaying = false;
			$(this.bodyElem).find(".timelinejs-play").removeClass("selected");
			clearInterval(playInterval);
		}

	}

}())


