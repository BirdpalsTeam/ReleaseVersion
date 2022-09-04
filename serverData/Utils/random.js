exports.random = (stringLength) =>{
	let result = '';
	let characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
	for(let i = 0; i < characters.length; i++){
		result += characters.charAt(Math.floor(Math.random() * characters.length));
	}
	return result;
}