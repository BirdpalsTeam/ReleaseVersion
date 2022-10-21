//Server
var {random} = require('./serverData/Utils/random');
const path = require('path');
var compression = require('compression');
var express = require('express');
var helmet = require('helmet');
var app = express();
const PORTNUM = 25568;
const http = require('http').Server(app);
const io = require('socket.io')(http,{
	cors: {
		origin: "https://localhost:*",
		methods: ["GET", "POST"]
	  },
	  pingInterval: 25000,
	  pingTimeout: 60000
  }), session = require("express-session")({
    secret: random(31),
    resave: true,
    saveUninitialized: true,
	cookie: {sameSite: true}
  }), sharedsession = require("express-socket.io-session");

const server_socket = require('./serverData/Game/server_socket');
//Playfab
var PlayFab = require("./node_modules/playfab-sdk/Scripts/PlayFab/PlayFab");

const { PlayFabServer, PlayFabAdmin } = require('playfab-sdk');
const GAME_ID = '238E6';
PlayFab.settings.titleId = GAME_ID;
PlayFab.settings.developerSecretKey = '1YP575JK5RZOJFRMMSAT5DWWOG9FI6967KNH3YCCIKFQT7SNK7';
//Discord
const discordBot = require('./serverData/Discord/server_discord');
app.enable('trust proxy');

//Setups security headers
app.use(helmet({contentSecurityPolicy:{
	useDefaults: true,
    directives: {
	  "script-src": ["'self'"],
      "connect-src": ["'self'", "*.playfabapi.com"],
	  "style-src": ["'self'", "fonts.googleapis.com"]
    },}
}));

app.use(session);

//Use compression to reduce files size
app.use(compression({filter: function (req, res) {
    return true;
}}));

//Send the public files to the domain
app.get('/', (req, res) =>{
	return res.sendFile(path.join(__dirname, `public/index.html`), function(err){
		if(err){
			return res.status(404).send(`Cannot Get /index.html`);
		}
	})
});

app.get('/*', (req, res, next) =>{
	//if(req.get('cf-ray') != undefined && req.headers['x-forwarded-proto'] == 'https'){

	//}else{
	//	return	res.status(404).send('Not found');
	//} uncomment at final build
	res.setHeader(
		"Permissions-Policy",
		'fullscreen=(self), geolocation=(self), camera=(), microphone=(), payment=(), autoplay=(self), document-domain=()'
	);
	
	let options = {
        root: path.join(__dirname, 'public')
    };
	let split = req.path.split('/');
	let fileName = split[split.length - 1];

	if(split[1] === 'Moderation'){
		let player = io.sockets.sockets[req.headers.cookie.split('io=')[1]]; //Get socket player
		if(player !== undefined && player.handshake.address === req.ip){ //Guarantee that the connection is secure
			if(player.isDev !== undefined || player.isMod !== undefined){ // Guarantee it's not a normal player
				res.sendFile(decodeURI(req.path), options, function (err) {
					if (err) {
						return res.status(404).send(`Cannot GET /${fileName}`);
					}
				});
			}
		}else{
			return res.status(404).send(`Cannot GET /${fileName}`);
		}
	}else if(split[1] === 'Devs'){
		let player = io.sockets.sockets[req.headers.cookie.split('io=')[1]]; //Get socket player
		if(player !== undefined && player.handshake.address === req.ip){ //Guarantee that the connection is secure
			if(player.isDev !== undefined){ // Guarantee it's not a normal player
				res.sendFile(decodeURI(req.path), options, function (err) {
					if (err) {
						return res.status(404).send(`Cannot GET /${fileName}`);
					}
				});
			}
		}else{
			return res.status(404).send(`Cannot GET /${fileName}`);
		}
	}else if(split[1] !== 'Audio'){
		res.sendFile(decodeURI(req.path), options, function (err) {
			if (err) {
				return res.status(404).send(`Cannot GET /${fileName}`);
			}
		});
	}else{
		res.sendFile(path.join(__dirname, `public${decodeURI(req.path)}`), function(err){
			if(err){
				return res.status(404).send(`Cannot Get /${fileName}`);
			}
		})
	}
})


//Websockets communication
server_socket.connect(io, sharedsession(session), PlayFabServer, PlayFabAdmin, discordBot.client, discordBot);

//Start the server on port 
http.listen(process.env.PORT || PORTNUM, () => {
	console.log('listening on *:'+PORTNUM);
});