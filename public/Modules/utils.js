function getElementFromArray(element, customIdentifier, array){
	let tempElement;
	array.forEach(arrayElement =>{
		if(arrayElement[customIdentifier] === element[customIdentifier]){
			tempElement = arrayElement;
		}
	})
	return tempElement != undefined ? tempElement : false;
}

function checkIfElementIsInArray(element, customIdentifier, array){
	return getElementFromArray(element, customIdentifier, array) ? true : false;
}

function getElementFromArrayByValue(value, customIdentifier, array){
	let tempElement;
	array.forEach(arrayElement =>{
		if(arrayElement[customIdentifier] == value){
			tempElement = arrayElement;
		}
	});
	return tempElement != undefined ? tempElement : false;
}

function removeElementFromArray(element, array){
	array.splice(array.indexOf(element), 1);
}

function separateStrings(string){
	if(string == undefined) return;
	let separated = string.split(" ");
	return separated;
}

function command(command, message){
	socket.emit(command, message);	//Send command to the server
}

function setLocalMessage(thisMessage){
	let checkCommand = thisMessage.split(" ");
	if(checkCommand[0].includes("/") == true){	//Check if it's a command
		command(checkCommand[0], thisMessage);
	}else{
		localPlayer.message = thisMessage;
		if(localPlayer.messageTimeout != undefined){
			clearTimeout(localPlayer.messageTimeout);
			if(localPlayer.bubble.children[0] !== undefined) localPlayer.bubble.removeChildAt(0);
			localPlayer.drawBubble();
		}else if(localPlayer.messageTimeout == undefined){
			localPlayer.drawBubble();
		}
		socket.emit('message', thisMessage);
	}
}