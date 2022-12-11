exports.run = (socket, rooms, AFKTime, PlayFabAdmin, client, server_discord, server_utils, profanity, rateLimiter) => {
	socket.on('playerMovement', (playerMovement) =>{
			if(socket.playerId == undefined) return;
			server_utils.resetTimer(socket, AFKTime);
			let thisPlayerRoom = server_utils.getElementFromArrayByValue(socket.gameRoom, 'name', Object.values(rooms));
			let player = server_utils.getElementFromArrayByValue(socket.playerId, 'id', thisPlayerRoom.players);
			if(player != false){
				let movePlayerObject = {
					id: player.id,
					mouseX: playerMovement.mouseX, 
					mouseY: playerMovement.mouseY
				}
				player.mouseX = playerMovement.mouseX;
				player.mouseY = playerMovement.mouseY;
				if(player.isMoving == false){
					player.move(thisPlayerRoom);
				}else{
					clearInterval(player.movePlayerInterval);
					player.isMoving = false;
					try{
					player.move(thisPlayerRoom);
					}
					catch(err){
						console.log(err);
						console.log("Player: " + player);
					}
				}
				socket.broadcast.to(socket.gameRoom).emit('playerIsMoving', movePlayerObject);
			}
    })//Player Movement end

	socket.on('message',(message)=>{
		rateLimiter.consume(socket.id).then(()=>{
			if(socket.playerId == undefined || message == undefined) return;
			server_utils.resetTimer(socket, AFKTime);
			let thisPlayerRoom = server_utils.getElementFromArrayByValue(socket.gameRoom, 'name', Object.values(rooms));
			let player = server_utils.getElementFromArrayByValue(socket.playerId, 'id', thisPlayerRoom.players);
			let channel = client.channels.cache.get('845340183984341075');
			let dateUTC = new Date(Date.now()).toUTCString();
			if(server_utils.separateString(message)[0].includes("/") == false){
				if(profanity.filter(message) == true){
					let messageObject = {
						id: player.id,
						message: ":("
					}
					let embed = server_discord.embedText(dateUTC + '\n' + player.username + ' said:', message);
					console.log(dateUTC +'\n' + player.username + ' said: ' + message + '\n');
					channel.send(embed.setColor("#FF0000"));
					socket.emit('playerSaid', messageObject);
					socket.broadcast.to(socket.gameRoom).emit('playerSaid', messageObject);
				}else{
					let messageObject = {
						id: player.id,
						message: message
					}
					let embed = server_discord.embedText(dateUTC + '\n' +player.username + ' said:', message);
					console.log(dateUTC +'\n' + player.username + ' said: ' + message + '\n');
					//channel.send(embed.setColor("1ABBF5"))
					socket.broadcast.to(socket.gameRoom).emit('playerSaid', messageObject);
				}
		}
		}).catch((reason)=>{
			console.log(`stopped the SPAMMER! ${socket.playerId} ${reason} at messages`)
		})
		
	})

	socket.on('/room', (message) =>{
		//rateLimiter.consume(socket.id).then(()=>{
			if(socket.playerId == undefined) return;
			server_utils.resetTimer(socket, AFKTime);
			let thisPlayerRoom = server_utils.getElementFromArrayByValue(socket.gameRoom, 'name', Object.values(rooms));
			let player = server_utils.getElementFromArrayByValue(socket.playerId, 'id', thisPlayerRoom.players);
			message = server_utils.separateString(message);
			let wantedRoom = server_utils.getElementFromArrayByValue(message[1], 'name', Object.values(rooms));
			if(wantedRoom == false) return; //Check if the room the player wants to go exists
				if(!wantedRoom.closed){
				if(player.isMoving == true){
					clearInterval(player.movePlayerInterval);
					player.isMoving = false;
				}
				player.x = wantedRoom.entrances[0][0];
				player.y = wantedRoom.entrances[0][1];
				player.mouseX = wantedRoom.entrances[0][0];
				player.mouseY = wantedRoom.entrances[0][1];
				server_utils.removeElementFromArray(player, thisPlayerRoom.players); //Remove player from the room
				socket.broadcast.to(socket.gameRoom).emit('byePlayer', player);//Say to everyone on the room that this player is gone
				socket.emit('leaveRoom');
				socket.leave(socket.gameRoom); //Leave room on server
				socket.join(wantedRoom.name); //Join new room
				socket.gameRoom = wantedRoom.name;
				wantedRoom.players.push(player);
				socket.emit('joinRoom',{name: wantedRoom.name, posX: player.x, posY: player.y});
				socket.broadcast.to(socket.gameRoom).emit('newPlayer', (player)); //Say to everyone on the new room that the player is there
				let preventRecursion = wantedRoom.players;
				preventRecursion.forEach(player =>{
					if(player.isMoving == true){
						clearInterval(player.movePlayerInterval);
						player.isMoving = false;
						player.x = player.mouseX;
						player.y = player.mouseY;
					}
				})
				socket.emit('loggedIn', (preventRecursion)); //Say to the player who are in the new room
			}
			else{
				socket.emit("HideLoading")
			}
		//}//).catch(()=>{
		//	console.log(`This guy is trying to DoS /rooms ${socket.playerId}`); Removed because this would appear when players switched rooms too quickly
		//})
	})

	socket.on('makeMeInvisible',(i) => {
		let thisPlayerRoom = server_utils.getElementFromArrayByValue(socket.gameRoom, 'name', Object.values(rooms));
		let player = server_utils.getElementFromArrayByValue(socket.playerId, 'id', thisPlayerRoom.players);
		player.visible = false;
		info = {id:socket.playerId};
		socket.broadcast.to(socket.gameRoom).emit('makeInvisible', info);
	});

	socket.on('finishedChangingColour',(colours) => {
		rateLimiter.consume(socket.id).then(()=>{
			try{
				let thisPlayerRoom = server_utils.getElementFromArrayByValue(socket.gameRoom, 'name', Object.values(rooms));
				let player = server_utils.getElementFromArrayByValue(socket.playerId, 'id', thisPlayerRoom.players);
				player.colours.top = colours.top;
				player.colours.bottom = colours.bottom;
				player.visible = true;
				info = {colours:colours, id:socket.playerId};
				socket.broadcast.to(socket.gameRoom).emit('colourChange', info);
				updatePlayFabColours()

				function updatePlayFabColours(){
					PlayFabAdmin.UpdateUserReadOnlyData({PlayFabId: socket.playerId, Data:{topColour: colours.top.toString(), bottomColour: colours.bottom.toString()}}, (error, result) =>{
						if(error !== null){
							console.log(error);
						}
					})
				}
			}
			catch(err){
				console.log(err)
			}
		});
	});
}