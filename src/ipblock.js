// Make an array of people that have already voted
function AlreadyVoted(poll) {
	this.poll = poll;
	this.IP = [];
};

// New Poll
var Voted34 = new AlreadyVoted(34);

// Get the users current IP
// var userIP = req.headers['x-forwarded-for'] || 
//     req.connection.remoteAddress || 
//     req.socket.remoteAddress ||
//     req.connection.socket.remoteAddress;
//     console.log(ip);

// Write the users IP to the object
function pushIP(Poll, IP) {
	eval("Voted"+Poll)['IP'].push(IP);
}

pushIP(34, "127.0.0.1");
pushIP(34, "10.0.0.1");
pushIP(34, "213.10.8.15");


// Check if the user has voted on this poll
userIP = "213.10.8.15";

function hasVoted(Poll, userIP) {
	for (i = 0; i < eval("Voted"+Poll)['IP'].length; i++) {
		if (userIP === eval("Voted"+Poll)['IP'][i]) {
			console.log("user has voted already");
			return true;
		} else {
			console.log("user has not voted yet");
		}
	}
	return false;
}

if(hasVoted(34,userIP)){
	console.log("You have already voted in this poll.");
} else{
	// castVote(); // Have to look the actual function up in app.js
	pushIP(eval("Voted"+Poll), userIP);
}