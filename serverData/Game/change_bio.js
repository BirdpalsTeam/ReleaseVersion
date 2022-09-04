exports.run = (socket, rooms, AFKTime, PlayFabAdmin, profanity, server_utils, rateLimiter)=>{
	socket.on('/changeBio', (newBio) =>{
		rateLimiter.consume(socket.id).then(()=>{
			if(socket.playerId == undefined || newBio == undefined || typeof newBio !== "string" || newBio.length > 144) return;
			server_utils.resetTimer(socket, AFKTime);
			let thisPlayerRoom = server_utils.getElementFromArrayByValue(socket.gameRoom, 'name', Object.values(rooms));
			let player = server_utils.getElementFromArrayByValue(socket.playerId, 'id', thisPlayerRoom.players);
			if(profanity.filter(newBio) == true){
				newBio = 'I wish the world becomes a better place!';
				updateBio();
			}else{
				updateBio();
			}

			function updateBio(){
				PlayFabAdmin.UpdateUserReadOnlyData({PlayFabId: socket.playerId, Data:{biography: newBio}}, (error, result) =>{
					if(result !== null){
						if(player == undefined) return;
						player.bio = newBio;
						socket.broadcast.to(socket.gameRoom).emit('changedBio', {player: socket.playerId, newBio: newBio});
					}else if(error !== null){
						console.log(error);
					}
				})
			}
			
		}).catch((reason) =>{
			console.log(`This jerk is trying to DoS ${socket.playerId} ${reason} bio`);
		})
	})
}