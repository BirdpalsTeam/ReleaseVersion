//profanity and etc
const fs = require('fs');
const profanity = require('../Utils/profanity filter');
const server_utils = require('../Utils/server-utils');
const server_discord = require('../Discord/server_discord');
const AFKTime = 300000; //5 minutes
var { Polygon } = require('../Utils/Collisions.min');
var decomp = require('poly-decomp');
//Scripts
var { Player } = require('./Player');
const movement_messages = require('./movement_messages');
const login = require('./login');
const update_inventory = require('./update_inventory');
const change_bio = require('./change_bio');
const give_item = require('./give_item.js');
const moderation_commands = require('./moderation_commands');
const add_friend = require('./add_friend');
//DDoS prevention
const { RateLimiterMemory } = require('rate-limiter-flexible');
const rateLimiter = new RateLimiterMemory({points: 3, duration: 1});

exports.connect = (io, session, PlayFabServer, PlayFabAdmin, client, discordBot) => {
	var roomsJson = fs.readFileSync('./serverData/Utils/roomsJSON.json');
	var rooms = JSON.parse(roomsJson);
	for(let roomInJson in rooms){
		let room = rooms[roomInJson];
		let convexPolygons = decomp.quickDecomp(room.colliders);
		room.collision = new Array();
		convexPolygons.forEach((polygon) => {
			room.collision.push(new Polygon(0, 0, polygon))
		});
	}
	var players = new Array();
	var devTeamJson = fs.readFileSync('./serverData/Utils/devTeam.json');
	var devTeam = JSON.parse(devTeamJson);
	var modTeamJson = fs.readFileSync('./serverData/Utils/modTeam.json');
	var modTeam = JSON.parse(modTeamJson);
	var IPBanned = new Array();
	server_utils.getPlayersInSegment('1B7192766262CE36').then((response)=>{ //push the ip of the banned players to the IPBanned array, please don't log them.
		let bannedList = response.data.PlayerProfiles;
		if(bannedList.length > 0){
			bannedList.forEach((player) =>{
				PlayFabServer.GetUserBans({PlayFabId: player.PlayerId}, (error, result) =>{
					if(result !== null){
						result.data.BanData.forEach((ban) =>{
							if(ban.Active == true && ban.IPAddress != undefined){
								IPBanned.push(ban.IPAddress);
							}
						})
					}else if(error !== null){
						console.log(error);
					}
				})
			})
		}
	}).catch(console.log);

	let modDir = fs.readdirSync(`${__dirname}/../../public/Moderation`);
	var modScripts = new Array();
	modDir.filter((fileName) =>{
		if(fileName.includes('.js')){
			modScripts.push(`Moderation/${fileName}`);
		}
	})
	
	let devDir = fs.readdirSync(`${__dirname}/../../public/Devs`);
	var devScripts = new Array();
	devDir.filter((fileName) =>{
		if(fileName.includes('.js')){
			devScripts.push(`Devs/${fileName}`);
		}
	})

io.use(session);

io.on('connection', (socket) => {
	console.log('A user connected: ' + socket.id);
	/*if(socket.handshake.headers['cf-ray'] == undefined || socket.handshake.headers['cf-connecting-ip'] == undefined ){
		socket.disconnect(true);
	}else{
		socket.ip = socket.handshake.headers['cf-connecting-ip'];
	}uncomment at final build*/
	
	socket.on('disconnect', function(){
		console.log('A user disconnected: ' + socket.id);
		if(players.length > 0){
			let disconnectedPlayer = server_utils.getElementFromArrayByValue(socket.playerId, 'id', players);
			let thisPlayerRoom = server_utils.getElementFromArrayByValue(socket.gameRoom, 'name', Object.values(rooms));
			if(disconnectedPlayer == false || thisPlayerRoom.players == false) return;
			let thisPlayer = server_utils.getElementFromArrayByValue(socket.playerId, 'id', thisPlayerRoom.players);
			if(thisPlayer.isMoving == true){
				clearInterval(thisPlayer.movePlayerInterval);
				thisPlayer.isMoving == false;
			}
			socket.broadcast.to(socket.gameRoom).emit('byePlayer', disconnectedPlayer);
			server_utils.removeElementFromArray(disconnectedPlayer, players);
			server_utils.removeElementFromArray(disconnectedPlayer, thisPlayerRoom.players);
		}
	})
	
	socket.on('Im Ready', () =>{
		rateLimiter.consume(socket.id).then(()=>{
			if(socket.playerId == undefined) return;
			let thisPlayerRoom = server_utils.getElementFromArrayByValue(socket.gameRoom, 'name', Object.values(rooms));
			//socket.io can't send running functions, so you need to pause the players movement
			let preventRecursion = thisPlayerRoom.players;
			preventRecursion.forEach(player=>{
				if(player.isMoving == true){
					clearInterval(player.movePlayerInterval);
					player.isMoving == false;
				}
				if(player.id == socket.id){
					console.log("Two of the Same Players Found. Deleting Clone.")
					socket.broadcast.to(socket.gameRoom).emit('byePlayer', player);
				}
			})
			socket.emit('loggedIn', (preventRecursion)); //there is a problem here
			socket.isAFK = setTimeout(()=>{	//AFK cronometer
				socket.disconnect(true);
			}, AFKTime)

			if(socket.isMod !== undefined || socket.isDev !== undefined){
				socket.emit('M', modScripts); //Send scripts to mods
			}
			if(socket.isDev !== undefined){
				socket.emit('M', devScripts);
			}
		}).catch((err) =>{
			console.log(`This jerk is trying to DoS our game ${socket.playerId}`);
		})
		
	})
	
	login.run(io, socket, players, Player, rooms, devTeam, modTeam, IPBanned, PlayFabServer, PlayFabAdmin, profanity, server_utils, rateLimiter);

	movement_messages.run(socket, rooms, AFKTime, client, server_discord, server_utils, profanity, rateLimiter); //Rooms command is here

	update_inventory.run(socket, rooms, AFKTime, PlayFabAdmin, PlayFabServer, server_utils, rateLimiter);

	change_bio.run(socket, rooms, AFKTime, PlayFabAdmin, profanity, server_utils, rateLimiter);

	give_item.run(socket, AFKTime, PlayFabServer, server_utils, rateLimiter);

	moderation_commands.run(io, socket, server_utils, AFKTime, rooms, devTeam, IPBanned, PlayFabServer, client, server_discord);

	add_friend.run(socket, AFKTime, PlayFabServer, server_utils, rateLimiter);
}) // io connection end

//Discord
discordBot.startBot(PlayFabServer, IPBanned, io);
}