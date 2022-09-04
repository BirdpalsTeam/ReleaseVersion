exports.run = (io, socket, server_utils, AFKTime , rooms, devTeam, IPBanned, PlayFabServer, client, server_discord) =>{
	socket.on('/report', (message) =>{
		if(socket.playerId == undefined) return;
		server_utils.resetTimer(socket, AFKTime);
		let thisPlayerRoom = server_utils.getElementFromArrayByValue(socket.gameRoom, 'name', Object.values(rooms));
		let reporter = server_utils.getElementFromArrayByValue(socket.playerId, 'id', thisPlayerRoom.players); //The user who is reporting

		message = server_utils.separateString(message);
		let playerName = message[0];
		if(playerName == undefined || message[1] == undefined) return;
		server_utils.getPlayfabUserByUsername(playerName).then(response =>{
			//Prevents reportMessage spaces from beeing deleted
			let reportMessage = message.slice(1, message.length);
			reportMessage = reportMessage.toString().split(',').join(' ');
			let channel = client.channels.cache.get('845340393461645352'); //Connect to report channel on discord
			PlayFabServer.ReportPlayer({ReporterId: reporter.id, ReporteeId: response.data.UserInfo.PlayFabId, Comment: reportMessage}, (error, result) =>{
				if(result !== null){
					let dateUTC = new Date(Date.now()).toUTCString();
					console.log(result); //result.data.Updated
					let embed = server_discord.embedText(dateUTC + '\n' + reporter.username + ' reported ' + playerName, reportMessage);
					channel.send(embed.setColor('FFFB00'));
				}else if(error !== null){
					console.log(error);	//error.errorMessage
				}
			});
		}).catch(console.log);
		
	})
	
	socket.on('/ban', (message) =>{
		if(socket.playerId == undefined) return;
		server_utils.resetTimer(socket, AFKTime);
	
		if(socket.isDev !== undefined || socket.isMod !== undefined){	//Template of the message should be /ban timeOfBan banPlayerName reason
			message = server_utils.separateString(message);
			let timeOfBan = message[0];
			let banPlayerName = message[1];
			let IPban = message[2];
			let reason = message.slice(3,message.length);
			reason = reason.toString().split(',').join(' '); //Returns the reason with spaces
			
			if(isNaN(timeOfBan) == true || banPlayerName == undefined || reason == undefined) return; //Check if the message is in correct form
			if(timeOfBan > 9999){
				timeOfBan = '9999';
			}
			let banRequest;
	
			server_utils.getPlayfabUserByUsername(banPlayerName).then(response => { 
				let banMessage = response.data.UserInfo.TitleInfo.DisplayName + ' was banned because ' + reason + ' until ' + timeOfBan + ' h.';
				let banPlayerId = response.data.UserInfo.PlayFabId;
				if(server_utils.getElementFromArrayByValue(banPlayerId, 'id', devTeam.devs) == false){ //Find if the mod is not trying to ban a dev
					if(timeOfBan === '9999'){	//Perma ban
						if(IPban == 'true'){
							server_utils.getPlayerInternalData(banPlayerId).then((response)=>{
								banRequest = {
									Bans: [{PlayFabId: banPlayerId, Reason: reason, IPAddress: response.data.Data.IPAddress.Value}]
								}
								ban(IPBanned);
							}).catch((error)=>{
								console.log(error);
							})
							
						}else{
							banRequest = {
								Bans: [{PlayFabId: banPlayerId, Reason: reason}]
							}
							ban();
						}
						
					}else{
						if(IPban == 'true'){
							server_utils.getPlayerInternalData(banPlayerId).then((response)=>{
								banRequest = {
									Bans: [{DurationInHours: timeOfBan, PlayFabId: banPlayerId, Reason: reason, IPAddress: response.data.Data.IPAddress.Value}]
								}
								ban(IPBanned);
							}).catch((error)=>{
								console.log(error);
							})
						}else{
							banRequest = {
								Bans: [{DurationInHours: timeOfBan, PlayFabId: banPlayerId, Reason: reason}]
							}
							ban();
						}
						
					}
				function ban(IPBanned){
					let removeBannedPlayerSocket;
					Object.keys(io.sockets.sockets).forEach((socket) =>{
						if(io.sockets.sockets[socket].playerId == banPlayerId){
							removeBannedPlayerSocket = io.sockets.sockets[socket];
						}
					})
					if(removeBannedPlayerSocket.isDev !== undefined || socket.isMod !== undefined && removeBannedPlayerSocket.isMod !== undefined) return;
					PlayFabServer.BanUsers(banRequest, (error, result) =>{	//Ban request to playfab
						if(result !== null){
							socket.emit('playerBanned!');
							let channel = client.channels.cache.get('845331071322423318');
							let dateUTC = new Date(Date.now()).toUTCString();
							let embed = server_discord.embedText(dateUTC, banMessage);
							channel.send(embed.setColor("#FF0000"));
							if(IPBanned !== undefined){IPBanned.push(banRequest.Bans[0].IPAddress)};
							if(removeBannedPlayerSocket == false) return; //Check if the player is online
							removeBannedPlayerSocket.disconnect(true);
						}else if(error !== null){
							console.log(error)
						}
					})
				}
				}
			}).catch(console.log); //Log error
	
		}// IsDev final
	});
	
	socket.on('/unban', (message) =>{
		if(socket.playerId == undefined) return;
		server_utils.resetTimer(socket, AFKTime);
	
		if(socket.isDev == true || socket.isMod == true){	//Template of the message should be /unban banPlayerName
			message = server_utils.separateString(message);
			let banPlayerName = message[1];
			if(banPlayerName == undefined) return; //Check if the message is in the correct form.
			
			server_utils.getPlayfabUserByUsername(banPlayerName).then(response =>{
				let PlayFabId =  response.data.UserInfo.PlayFabId;
				PlayFabServer.RevokeAllBansForUser({PlayFabId: PlayFabId}, (error, result) =>{	//Revoke All Bans from user
					if(result !== null){
						server_utils.removePlayerTag(PlayFabId, 'isBanned').then(()=>{
							socket.emit('playerUnbanned!');
							let channel = client.channels.cache.get('845331071322423318');
							let dateUTC = new Date(Date.now()).toUTCString();
							let embed = server_discord.embedText(dateUTC, banPlayerName + ' was unbanned :)');
							channel.send(embed.setColor("#00FF00"));
							server_utils.getPlayerInternalData(PlayFabId).then((response)=>{
								let playerIP = response.data.Data.IPAddress.Value;
								if(IPBanned.indexOf(playerIP) != -1){
									server_utils.removeElementFromArray(playerIP, IPBanned);
								}
							}).catch(console.log);
						}).catch(console.log)
					}else if(error !== null){
						console.log(error);
					}
				});
			}).catch(console.log);
		}
	})
	
	socket.on('/remove', (message) =>{
		if(socket.playerId == undefined) return;
		server_utils.resetTimer(socket, AFKTime);
		let thisPlayerRoom = server_utils.getElementFromArrayByValue(socket.gameRoom, 'name', Object.values(rooms));
		
		if(socket.isDev !== undefined || socket.isMod !== undefined){
			let removePlayerObject = server_utils.getElementFromArrayByValue(message, 'username', thisPlayerRoom.players);
			if(removePlayerObject == false) return;
			let removePlayerSocket;
			Object.keys(io.sockets.sockets).forEach((socket) =>{
				if(io.sockets.sockets[socket].playerId == removePlayerObject.id){
					removePlayerSocket = io.sockets.sockets[socket];
				}
			})
			if(removePlayerSocket === undefined || removePlayerSocket.isDev !== undefined || removePlayerSocket.isMod !== undefined && socket.isMod !== undefined) return;
			removePlayerSocket.disconnect(true);
		}
	})
}