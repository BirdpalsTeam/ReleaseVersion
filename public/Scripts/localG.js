PlayFab.settings.titleId = '238E6';
PlayFab._internalSettings.sessionTicket = sessionStorage.ticket;
document.getElementById('inputElements').hidden = false;
form = document.getElementById("form");
input = document.getElementById("input");

form.addEventListener('submit', function(e) {
	e.preventDefault();
	sendMessage();
});
document.getElementById("SendButton").onclick = function(){
	sendMessage();
}
function sendMessage(){
	if (input.value) {	
		setLocalMessage(input.value);
		addToChatbox(`${localPlayer.username}: ${input.value}`);
		input.value = '';
	}
}

let bottomColor = 0x38a2eb;
let topColor = 0x359ade;

document.getElementById('bird_color_bottom').addEventListener("input", function(c){
	app.bottomColour = c.target.value.replace('#',"0x");
	app.changeBirdFilter();
}, false);
document.getElementById('bird_color_top').addEventListener("input", function(c){
	app.topColour = c.target.value.replace('#',"0x");
	app.changeBirdFilter();
}, false);


inventory = null;
document.getElementById('inventory').onclick = function(){
	if (inventory == null){
		inventory = new Inventory();
	}
	inventory.open();
}

function addToChatbox(chatboxtext){
	let p = document.createElement('p'); //Creates a <p> tag
	p.textContent += chatboxtext;
	chatbox.appendChild(p);
	chatbox.scrollTop = chatbox.scrollHeight;
}

var emitter = new SnowParticle();
var elapsed = Date.now();
var update = function(){
  
	// Update the next frame
	requestAnimationFrame(update);
	
	var now = Date.now();
	
	// The emitter requires the elapsed seconds
	emitter.update((now - elapsed) * 0.001);
	elapsed = now;
  
};
//if(app.ticker.FPS >= 25) update();


//Settings
var settingsDiv = document.getElementById("SettingsDiv");
function toggleSettings(){
	settingsDiv.hidden = !settingsDiv.hidden;
}
document.getElementById("SettingsButton").onclick = function(){toggleSettings();};

var uncheckedImg = new Image();
uncheckedImg.src = "Sprites/hud/unchecked.png"
var checkedImg = new Image();
checkedImg.src = "Sprites/hud/checked.png"

function toggleCheckbox(box){
	if(box.src == checkedImg.src){
		box.src = uncheckedImg.src;
	}
	else{
		box.src = checkedImg.src;
	}
}

function toggleChatbox(){
	if(chatbox.hidden == true){
		chatbox.hidden = false;
		isChatBoxToggle = false;
	}
	else{
		chatbox.hidden = true;
		isChatBoxToggle = true;
	}
}
var audioHTML = document.getElementById("backgroundMusic")
function toggleMusic(){
	if(audioHTML.volume != 0){
		audioHTML.volume = 0;
	}
	else{
		audioHTML.volume = 1;
	}
}
var globalSFXVol = 1;
function toggleSound(){
	if(globalSFXVol != 0){
		globalSFXVol = 0;
	}
	else{
		globalSFXVol = 1;
	}
}

chatBoxCheck = document.getElementById('ChatBoxCheck')
chatBoxCheck.onclick = function(){toggleChatbox();toggleCheckbox(chatBoxCheck)};

musicCheck = document.getElementById('MusicCheck')
musicCheck.onclick = function(){toggleMusic();toggleCheckbox(musicCheck)};

soundCheck = document.getElementById('SoundCheck')
soundCheck.onclick = function(){toggleSound();toggleCheckbox(soundCheck)};