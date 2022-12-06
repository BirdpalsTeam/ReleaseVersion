exports.run = (io, socket, players, Player, rooms, devTeam, modTeam, IPBanned, PlayFabServer, PlayFabAdmin, profanity, server_utils, rateLimiter) =>{

	socket.on('login',(ticket)=>{
		rateLimiter.consume(socket.id).then(()=>{
			PlayFabServer.AuthenticateSessionTicket({SessionTicket: ticket},(error,result)=>{
				if(result != null){
					let resultFromAuthentication = result;
					let PlayFabId = resultFromAuthentication.data.UserInfo.PlayFabId;
					let PlayerProfileViewConstraints = {
						ShowContactEmailAddresses: true
					}
					let playerProfileRequest = {
						PlayFabId: result.data.UserInfo.PlayFabId,
						ProfileConstraints: PlayerProfileViewConstraints
					}

					let playerIP;

					if(resultFromAuthentication.data.UserInfo.TitleInfo.isBanned == true){ //Check if the player is banned
						socket.emit('errors', 'Sorry, but you are banned.'); 
						socket.disconnect(true)
						return;
					}else{
						server_utils.getPlayerInternalData(PlayFabId).then((response)=>{
							playerIP = response.data.Data.IPAddress.Value;
							if(IPBanned.indexOf(playerIP) != -1){
								socket.emit('errors', 'The IP making this request is banned.');
								socket.disconnect(true);
								return;
							}
						}).catch(console.log);
					}

					let userInfo = resultFromAuthentication.data.UserInfo;
					let playerTags = new Array();

					function addReabilityToPlayerAccount(PlayFabId, userInfo, canLogin){
						server_utils.addPlayerTag(PlayFabId, 'isReliable').then(() => {
							console.log(`Added isReliable to ${userInfo.Username}`);
						}).catch(console.log);
					}

					server_utils.getPlayerTags(PlayFabId).then((response) =>{
						playerTags = response.data.Tags; //Gets tags from playfab
						//playerTags.indexOf('title.238E6') == -1 means that this player doesn't have the isReliable tag
						if(userInfo.PrivateInfo.Email != undefined && userInfo.TitleInfo.Created != undefined && playerTags.indexOf('title.238E6.isReliable') == -1){
							if(profanity.filter(userInfo.Username) == true){ //If user's display name is a bad word, it changes to Bird + randomId
								let randomId = '';
								let characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
								let charactersLength = characters.length;
								for ( var i = 0; i < 5; i++ ) {
									randomId += characters.charAt(Math.floor(Math.random() * charactersLength));
								}
								server_utils.changeUserDisplayName("Bird" + randomId, PlayFabId).then(() =>{
									console.log('Changed the display name of ' + PlayFabId);
									return addReabilityToPlayerAccount(PlayFabId, userInfo, false);	
								}).catch(console.log);
							}else{
								return addReabilityToPlayerAccount(PlayFabId, userInfo, true);
							}
						}else{
							return login(resultFromAuthentication, PlayFabId);
						}
					}).catch(console.log);
					function login(resultFromAuthentication, PlayFabId){
						PlayFabServer.GetPlayerProfile(playerProfileRequest, (error, result)=>{ //Get player profile
							// if(result !== null && result.data.PlayerProfile.ContactEmailAddresses[0] != undefined){
								if(result !== null){
									// if(result.data.PlayerProfile.ContactEmailAddresses[0].VerificationStatus == "Confirmed"){ //Player is verified
									if(result !== null) {
										if(playerTags.indexOf('title.238E6.isReliable') != -1){ //Ensures that the player was verified by this server.
											PlayFabAdmin.GetUserInventory({PlayFabId: PlayFabId}, (error, result) =>{ //Get player inventory
												if(result !== null){
													let inventory = result.data.Inventory;

													PlayFabAdmin.GetUserReadOnlyData({PlayFabId: PlayFabId}, (error, result) =>{ //Get Biography
														if(result !== null){
															let biography;
															//Check if the player has a biography.
															result.data.Data.biography == undefined ? biography = "I like to play Birdpals!" : biography = result.data.Data.biography.Value;
															if(result.data.Data.biography != undefined && profanity.filter(biography) == true){
																biography = "love";
															}

															//Check if the Player has a Colour
															let tempTopColour = 0x359ade;
															let tempBottomColour = 0x38a2eb;
															if(result.data.Data.topColour != undefined && result.data.Data.bottomColour != undefined){
																tempTopColour = Number(result.data.Data.topColour.Value);
																tempBottomColour = Number(result.data.Data.bottomColour.Value);
															}

															if(players.length > 0){	//Check if there is at least one player online
																					//This doesn't work and there's a new solution but I'm scared to remove it
																let logged, preventRecursion;
																preventRecursion = Object.keys(io.sockets.sockets);
																let playerAlreadyLogged = server_utils.getElementFromArrayByValue(PlayFabId, 'playerId', preventRecursion);
																//Check if the player is already logged in
																if(playerAlreadyLogged != false){
																	socket.emit('errors', 'You are already logged in! Please enter with another account or try to login again.');
																	//It is needed to stop the player's movement from the account that it is already logged.
																	let thisPlayerRoom = server_utils.getElementFromArrayByValue(playerAlreadyLogged.gameRoom, 'name', Object.values(rooms));
																	let preventRecursion2 = thisPlayerRoom.players;
																	let thisPlayer = server_utils.getElementFromArrayByValue(playerAlreadyLogged.playerId, 'id', preventRecursion2);
																	if(thisPlayer.isMoving == true){
																		clearInterval(thisPlayer.movePlayerInterval);
																		thisPlayer.isMoving == false;
																	}
																	playerAlreadyLogged.emit('loggedOut');
																	playerAlreadyLogged.disconnect(true);
																	logged = true;
																}
																
																logged == true ? logged = false : createPlayer(PlayFabId, inventory, biography, tempTopColour, tempBottomColour);	//If the player is not logged in create player
																
															}else{	//If not create this first player
																createPlayer(PlayFabId, inventory, biography, tempTopColour, tempBottomColour);
															}
														}else if(error !== null){
															console.log("Get User Readable data error: " + error);
														}
													})
												}else if(error !== null){
													console.log("Inventory error: " + error.data);
												}
												
											})
										}
										if(playerTags.indexOf('title.238E6.isBanned') != -1 && resultFromAuthentication.data.UserInfo.TitleInfo.isBanned == false){ //Remove isBanned tag for unbanned players.
											server_utils.removePlayerTag(PlayFabId, 'isBanned').then().catch(console.log);
											if(IPBanned.indexOf(playerIP) != -1){server_utils.removeElementFromArray(playerIP, IPBanned)};
										}

										function createPlayer(thisPlayer, inventory, biography, topColour, bottomColour){
											PlayFabServer.GetFriendsList({PlayFabId: PlayFabId}, (error, result)=>{
												if(error !== null){
													console.log(error);
												}else if(result !== null){
													playerGear = new Array();
													inventory.forEach((equippedItem) =>{
														try{ //This try catch stops the server from crashing until the player opens their inventory.
															if(equippedItem.CustomData.isEquipped == 'true'){ //Get the items the player is wearing
																let item, ItemClass, ItemId, isEquipped;
																ItemClass = equippedItem.ItemClass;
																ItemId = equippedItem.ItemId;
																isEquipped = equippedItem.CustomData;
																item = {ItemClass, ItemId, isEquipped}; //Removes informations that may affect the security
																playerGear.push(item);
															}
														}
														catch(error){
															console.log("There's an error here: " + error);
														}
													})

													socket.gameRoom = rooms.town.name;

													//Checks if the Player is in the Room and deletes any Clones
													Object.entries(rooms).forEach(([_room,_value]) => {
														let thisPlayerRoom = _value;
														if (thisPlayerRoom){
															try{
																thisPlayerRoom.players.forEach(player=>{
																	if(player != undefined){
																		if(player.username.toLowerCase() == userInfo.Username && player.id != userInfo.id){
																			console.log("Two of the Same Players Found. Deleting Clone.")
																			socket.broadcast.to(socket.gameRoom).emit('byePlayer', player);
																			//I would disconnect the clone player here but I can't figure out a way to do that so hahahahahaaaaaaaa
																			server_utils.removeElementFromArray(player, players);
																			server_utils.removeElementFromArray(player, thisPlayerRoom.players);
																		}
																	}
																})
															}
															catch(err){
																console.log(err)
															}
														}
													})

													//Adds Player to Rooms and Other Clients
													thisPlayer = new Player(PlayFabId, resultFromAuthentication.data.UserInfo.TitleInfo.DisplayName, playerGear, biography, result.data.Friends, topColour, bottomColour);
													if(server_utils.getElementFromArrayByValue(PlayFabId, 'id', devTeam.devs) != false){
														socket.isDev = true;
													}else if(server_utils.getElementFromArrayByValue(PlayFabId, 'id', modTeam.mods) != false){
														socket.isMod = true;
													}
													if(socket.disconnected == true) return;
													players.push(thisPlayer);
													socket.playerId = resultFromAuthentication.data.UserInfo.PlayFabId;
													socket.join(rooms.town.name);
													rooms.town.players.push(thisPlayer);
													socket.emit('readyToPlay?');	//Say to the client they can already start playing
													socket.broadcast.to(socket.gameRoom).emit('newPlayer', thisPlayer); //Emit this player to all clients logged in
												}
											})
										}
			
								}else if (result.data.PlayerProfile.ContactEmailAddresses[0].VerificationStatus == "Unverified" || result.data.PlayerProfile.ContactEmailAddresses[0].VerificationStatus == "Pending"){
									let SendEmailFromTemplateRequest ={
										EmailTemplateId: '97A33843288F67E',
										PlayFabId: result.data.PlayerProfile.PlayerId
									}
									
									PlayFabServer.SendEmailFromTemplate(SendEmailFromTemplateRequest, (error, result) => {
										if(result !== null){
											console.log('Verification e-mail send to ' + userInfo.Username);
										}else if(error !== null){
											console.log(error);
										}
									})
			
									socket.emit('errors', 'You are not verified! Please check your e-mail to verify your account.');
									socket.disconnect(true);
								}
							}
							else if(error !== null){
								console.log(error)
							}else{
								return socket.emit('errors', 'Ooops! Sorry, something went wrong. Please, try again later.');
							}
						})
					}
				}else if (error != null){
					console.log(error);
					socket.emit('errors', 'Ooops! Something went wrong. Please, try again later.');
				}
			})
		}).catch(()=>{
			console.log(`This guy is trying to DoS login event ${socket.id}`)
		})
	})
	
}