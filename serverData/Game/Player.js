let { Point } = require('../Utils/Collisions.min.js');
exports.Player = class Player{
	constructor(id, username, gear=[], biography, friends=[], topColour, bottomColour){
		this.id = id;
		this.username = username;
		this.x = 500;
		this.y = 460;
		this.isMoving = false;
		this.mouseX = 495;
		this.mouseY = 492;
		this.message = "";
		this.movePlayerInterval;
		this.gear = gear;
		this.bio = biography;
		this.friends = friends;
		this.collider = new Point(this.x, this.y);

		//this.colours = {top:0x359ade,bottom:0x38a2eb}
		this.colours = {top:topColour,bottom:bottomColour}

		this.visible = true;
	}
	move(room){
		this.isMoving = true;
		let dx = this.mouseX - this.x;
		let dy = this.mouseY - this.y;
		
		let angleToMove = Math.atan2(dy,dx);

		let speed = 4.0032;

		let velX = Math.cos(angleToMove) * speed;
		let velY = Math.sin(angleToMove) * speed;
		let timeToPlayerReachDestination = Math.floor(dx/velX);
		let collided = false;

		let collisionArray = room.collision;
		
		this.movePlayerInterval = setInterval(() => {
			if(timeToPlayerReachDestination <= 0 || collided == true){
				this.isMoving = false;
				return clearInterval(this.movePlayerInterval);
			}

			let newX = this.x + velX;
			let newY = this.y + velY;
			
			this.collider.x = newX;
			this.collider.y = newY;
			
			let collisions = 0; //Variable to see if the player is not inside of all polygons
			collisionArray.forEach((polygon) =>{
				if(this.collider.collides(polygon) == false){
					collisions += 1;
				}
			})
			if(collisions == collisionArray.length){ //If the player is not inside of any polygon, it means it is trying to got out
				this.isMoving = false;
				this.collider.x = this.x;
				this.collider.y = this.y;
				collided = true;
				return clearInterval(this.movePlayerInterval);
			}
			if(collided == false){ //Guarantees that the player hasn't collided
				this.x = newX;
				this.y = newY;
				timeToPlayerReachDestination--;
			}
		}, 1000 / 60);	
	}
}