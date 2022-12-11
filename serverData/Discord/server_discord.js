//Discord Bot
const Discord = require('discord.js');
const client = new Discord.Client();
const server_utils = require('../Utils/server-utils');
exports.embedText = function embedText(who, message){
	return new Discord.MessageEmbed().addField(who, message);
}
function embedText(who, message){
	return new Discord.MessageEmbed().addField(who, message);
}
let prefix = '!';
exports.startBot = (PlayFabServer, IPBanned, io, server_utils, rooms) => {
	client.on('message' ,(message) =>{
		if (!message.content.startsWith(prefix) || message.author.bot) return;
		if(message.member.roles.cache.has('760901805436960800') || message.member.roles.cache.has('845072414048387102')){
			const args = message.content.slice(prefix.length).trim().split(/ +/);
			const command = args.shift().toLowerCase();

			if(command == 'help'){
				message.channel.send(embedText("BIRDO HELP", "!ban <timeForBan (hours)> <PlayerName> <IsIPBan> <reason> --- Bans Player or Player's IP for a time. \n\n !unban <PlayerName> --- Unbans a Player").setColor('#FFFFFF'));
			}
	
			if(command == 'ban'){
				let messageFromDiscord = server_utils.separateString(message.content);
				let timeOfBan = messageFromDiscord[1];
				let banPlayerName = messageFromDiscord[2];
				let IPban = messageFromDiscord[3];
				let reason = messageFromDiscord.slice(4,messageFromDiscord.length);
				reason = reason.toString().split(',').join(' '); //Returns the reason with spaces
				if(isNaN(timeOfBan) == true || banPlayerName == undefined || reason == undefined) {return message.channel.send(embedText('Error:', 'Command contains invalid parameters.').setColor('#FFFB00'));} //Check if the message is in correct form
				let banRequest;
				server_utils.getPlayfabUserByUsername(banPlayerName).then(response =>{
					let banMessage = response.data.UserInfo.TitleInfo.DisplayName + ' was banned because ' + reason + ' until ' + timeOfBan + ' hour';
					let banPlayerId = response.data.UserInfo.PlayFabId;
					if(timeOfBan === '9999'){	//Perma ban
						if(IPban == 'true'){
							server_utils.getPlayerInternalData(banPlayerId).then((response)=>{
								banRequest = {
									Bans: [{PlayFabId: banPlayerId, Reason: reason, IPAddress: response.data.Data.IPAddress.Value}]
								}
								ban();
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
								ban();
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
					function ban(){
						let removeBannedPlayerSocket;
						Object.keys(io.sockets.sockets).forEach((socket) =>{
							if(io.sockets.sockets[socket].playerId == banPlayerId){
								removeBannedPlayerSocket = io.sockets.sockets[socket];
							}
						})
						if(removeBannedPlayerSocket.isDev !== undefined || removeBannedPlayerSocket.isMod !== undefined) return;
						PlayFabServer.BanUsers(banRequest, (error, result) =>{	//Ban request to playfab
							if(result !== null){
								let dateUTC = new Date(Date.now()).toUTCString();
								message.channel.send(embedText(dateUTC, banMessage).setColor('#FF0000'));
								if(IPBanned !== undefined){IPBanned.push(banRequest.Bans[0].IPAddress)};
							}else if(error !== null){
								console.log(error)
							}
						})
					}
						
					}).catch(error =>{
						message.channel.send(embedText('Error:', error.errorMessage).setColor('#FFFB00'))
				});
	
			}
			if(command == 'unban'){
				let messageFromDiscord = server_utils.separateString(message.content);
				let banPlayerName = messageFromDiscord[1];
				if(banPlayerName == undefined){return message.channel.send(embedText('Error:', 'Command contains invalid parameters.').setColor('#FFFB00'));} 
				server_utils.getPlayfabUserByUsername(banPlayerName).then(response =>{
					let PlayFabId =  response.data.UserInfo.PlayFabId;
					PlayFabServer.RevokeAllBansForUser({PlayFabId: PlayFabId}, (error, result) =>{	//Revoke All Bans from user
						if(result !== null){
							server_utils.removePlayerTag(PlayFabId, 'isBanned').then(()=>{
								let channel = client.channels.cache.get('845331071322423318');
								let dateUTC = new Date(Date.now()).toUTCString();
								let embed = embedText(dateUTC, banPlayerName + ' was unbanned :)');
								channel.send(embed.setColor("#00FF00"));
								server_utils.getPlayerInternalData(PlayFabId).then((response)=>{
									let playerIP = response.data.Data.IPAddress.Value;
									if(IPBanned.indexOf(playerIP) != -1){
										server_utils.removeElementFromArray(playerIP, IPBanned);
									}
								}).catch(console.log);
							}).catch((error) =>{
								console.log(error);
							})
						}else if(error !== null){
							console.log(error);
						}
					});
				}).catch(console.log);
			}

			if(command == "closeroom"){
				const messageFromDiscord = server_utils.separateString(message.content);
				const roomToClose = messageFromDiscord[1];
				const wantedRoom = server_utils.getElementFromArrayByValue(roomToClose, 'name', Object.values(rooms));
				if(wantedRoom == false) return message.channel.send(embedText('Error:', 'Command contains invalid parameters.').setColor('#FFFB00'));;
				wantedRoom.closed = true;
				message.channel.send(embedText("ROOM CLOSED", "Closed Room "+roomToClose).setColor('#FF0000'));
			}
			if(command == "openroom"){
				const messageFromDiscord = server_utils.separateString(message.content);
				const roomToOpen = messageFromDiscord[1];
				const wantedRoom = server_utils.getElementFromArrayByValue(roomToOpen, 'name', Object.values(rooms));
				if(wantedRoom == false) return message.channel.send(embedText('Error:', 'Command contains invalid parameters.').setColor('#FFFB00'));;
				wantedRoom.closed = false;
				message.channel.send(embedText("ROOM OPENED", "Opened Room "+roomToOpen).setColor('#FF0000'));
			}
		}
		
	})
	//Start the discord bot
	client.login('ODM4NTQ3NTYxNTgwMzMxMDcw.YI8sRg.15hZCkAeqKpFqjMF2jds5Et7o9U');
}
exports.client = client;