let antiCache = "?"+(new Date()).getTime();
let scriptsToAdd = ["./Scripts/States.js","./Scripts/Classes_O.js","./Scripts/Classes_PC.js","./Scripts/Classes_P.js","./Scripts/Classes_G.js","./Scripts/Classes_I.js","./Scripts/Classes_IT.js","./Minigames/Ping Pong/gsap.min.js","./Minigames/Ping Pong/game.js","./Scripts/pre-loader.js","./Scripts/localM.js"];

for(let i = 0; i < scriptsToAdd.length; i++){
    let tempscript = document.createElement("script");
    tempscript.src = scriptsToAdd[i] + antiCache;
    document.head.appendChild(tempscript);
}