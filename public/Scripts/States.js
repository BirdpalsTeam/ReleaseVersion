var worldResources;
function changeState(newState){
	worldResources = {};
	worldResources = app.loader.resources;
	app.destroy();
	app = newState;
}
function revertToWorld(){
	app.destroy();
	app = new WorldState(canvas);
	resources = worldResources;
}

class State extends PIXI.Application{
	constructor(htmlElement){
		super({
			width: 1000,
			height: 600,
			view: htmlElement
		});
		resources = this.loader.resources;
		this.stage.on('pointerdown', (evt)=>{
			this.onClick(evt);
		})
		this.stage.on('pointermove', (evt)=>{
			this.onMouseMove(evt);
		})

	}

	onClick(evt){

	}
	onMouseMove(evt){

	}
}

class WorldState extends State{
	constructor(htmlElement){
		super(htmlElement);
		this.stage.interactive = true;
		this.viewport = new pixi_viewport.Viewport({
			screenWidth: window.innerWidth,
			screenHeight: window.innerHeight,
			worldWidth: this.stage.width,
			worldHeight: this.stage.height,
		
			interaction: this.renderer.plugins.interaction // the interaction module is important for wheel to work properly when renderer.view is placed or scaled
		})

		this.stage.addChild(this.viewport);
	}

	onClick(evt){
		if(localPlayer.canMove == true){
			localPlayer.mouseX = Math.floor(evt.data.global.x);
			localPlayer.mouseY = Math.floor(evt.data.global.y);
			localPlayer.move();
			const playerMovement = {
				mouseX: localPlayer.mouseX,
				mouseY: localPlayer.mouseY
			}
			socket.emit('playerMovement', playerMovement);
		} 
	}
}

class ShopState extends State{
	constructor(htmlElement){
		super(htmlElement);
		this.stage.interactive = true;
		this.viewport = new pixi_viewport.Viewport({
			screenWidth: window.innerWidth,
			screenHeight: window.innerHeight,
			worldWidth: this.stage.width,
			worldHeight: this.stage.height,
		
			interaction: this.renderer.plugins.interaction // the interaction module is important for wheel to work properly when renderer.view is placed or scaled
		})

		this.stage.addChild(this.viewport);

		chatbox.hidden = true;

		this.shelves = [];

		this.addBackground();
		this.loadShelves();
	}

	addBackground(){
		let tempBackground = new PIXI.Graphics();
		tempBackground.beginFill(0xC37D37);
		tempBackground.drawRect(0,0,canvas.width,canvas.height);
		this.background = this.stage.addChild(tempBackground);
	}

	loadShelves(){
		for(let y = 0; y < 3; y++){
			for(let x = 0; x < 4; x++){
				let tempShelf = new PIXI.Graphics();
				tempShelf.beginFill(0x804000);
				tempShelf.drawRoundedRect(50 + x * 120, 50 + y * 120, 100, 100, 40);
				this.shelves.push(this.stage.addChild(tempShelf));
			}
		}
	}
}

class PingPong extends State{
	constructor(htmlElement){
		super(htmlElement);
		this.stage.interactive = true;
		this.viewport = new pixi_viewport.Viewport({
			screenWidth: window.innerWidth,
			screenHeight: window.innerHeight,
			worldWidth: this.stage.width,
			worldHeight: this.stage.height,
		
			interaction: this.renderer.plugins.interaction // the interaction module is important for wheel to work properly when renderer.view is placed or scaled
		})

		chatbox.hidden = true;
		this.stage.addChild(this.viewport);
		this.loader.add('racket', `Minigames/Ping Pong/racket.png`);
		this.loader.add('tabble', `Minigames/Ping Pong/tabble.png`);
		this.loader.add('ball', `Minigames/Ping Pong/ball.png`);
		this.loader.load();

		this.loaded = false;

		this.loader.onComplete.add(()=>{
			this.racket = new Racket('user');
			this.tabble = new Tabble();
			this.ball = new Ball();

			this.loaded = true;

			app.stage.addChild(this.tabble);
			app.stage.addChild(this.ball);
			app.stage.addChild(this.racket);

			/*
			this.getBatsSpeed = setInterval(function(){
				//console.log(`Speed X: ${racket.speedX}px/s, Y: ${racket.speedY}px/s`);
				this.racket.lastRotation = this.racket.rotation;
				if(this.ball.lastHit !== 'user') this.racket.fx = this.racket.fy = 0;
			}, 200);
			*/
		})

		
	}

	onMouseMove(evt){
		this.racket.x = evt.data.global.x;
		if(evt.data.global.y > 200) this.racket.y = evt.data.global.y;
		this.racket.collider.x = this.racket.x;
		this.racket.collider.y = this.racket.y;
		let radian = Math.PI / 180;
		//How does it work? I honestly don't know :/
		//My guess is that we divide the distance between the racket and the center of the canvas to a number that indicates the radius of the rotation
		//Then we convert this distance to radians by getting the minimum value between the distance and the maximum angle.
		//And we get the maximum value between the angle if it was for the right and the maximum angle of the left.
		//Math.max(Math.min((racket.x - (canvas.width / 2)) / 200, 90 * radian), -90 * radian)
		let angleToLook = Math.max(Math.min((this.racket.x - 500) / 200, 90 * radian), -90 * radian);
		this.racket.rotation = angleToLook;
		this.racket.update(this.ball, evt.data.originalEvent);
	}
}