// based on code from:
// https://github.com/CodingTrain/website/tree/master/CodingChallenges/CC_032.1_agar.io

/// Initialize express and listen on port
var express = require('express');
var app = express();
var server = app.listen(process.env.PORT || 3000, listen);

function listen() {
	var host = server.address().address;
	var port = server.address().port;
	console.log('Blobchat listening at http://' + host + ':' + port);
}

app.use(express.static('public'));
var io = require('socket.io')(server);

/// Blob definition, blobs dictionary, chats list
function Blob(name, id, x, y, r) {
	this.name = name;
	this.id = id;
	this.x = x;
	this.y = y;
	this.r = r;
	this.lastchat = "";
	this.lastchattime;
	this.velx = 0;
	this.vely = 0;
}

function Server(a, b, c) {
	this.blobsdict = a;
	this.chatslist = b;
	this.serverpermanents = c;
}

var serversdict = {};
var usertoservermap = {};
var socketidlist = [];

/// Register a callback function upon each individual connection
io.sockets.on('connection',
	function(socket) {
		// there is no way to access socket's room inherently in socket.io. 
		// that's why socket.join and socket.leave aren't enough, we need
		// usertoservermap to keep track of a map of user to server
		// and dynamically update it
		socket.join('lobby');

		socketidlist.push(socket.id);

		// keep track of which server this guy is connected to
		usertoservermap[socket.id] = 'lobby';

		// no one's here so make the lobby
		if (Object.keys(serversdict).length == 0 && !('lobby' in serversdict)) {
			// lobby server permanents
			var serverpermanents = [];
			let portal1 = new Blob("Portal to Game", "game", 150, 0, 5);
			let portal2 = new Blob("Portal to Room #2", "roomtwo", -150, 0, 5);
			serverpermanents.push(portal1);
			serverpermanents.push(portal2);
			
			lobby = new Server(blobsdict = {}, chatslist = [], serverpermanents);
			
			serversdict['lobby'] = lobby;
		}


		setInterval(heartbeat, 33);
		function heartbeat() {
			// route correct room information to the correct client depending on their server 
			io.to(usertoservermap[socket.id]).emit('heartbeat', [serversdict[usertoservermap[socket.id]], usertoservermap[socket.id]]);
		}

		console.log("New client joined with socket ID " + socket.id);
	
		/// Upon name change of user
		socket.on('name', 
			function(data) {
				console.log("Client " + serversdict[usertoservermap[socket.id]].blobsdict[socket.id].name + " changed name to " + data.name);
				serversdict[usertoservermap[socket.id]].blobsdict[socket.id].name = data.name; 
			}
		);

		/// Upon chat input of user
		socket.on('chat', 
			function(data) {
				console.log("Client " + serversdict[usertoservermap[socket.id]].blobsdict[socket.id].name + " says: " + data.chat);
				// chat is saved in blob (for on blob print) and chats list
				serversdict[usertoservermap[socket.id]].blobsdict[socket.id].lastchat = data.chat;
				serversdict[usertoservermap[socket.id]].blobsdict[socket.id].lastchattime = data.time;
				serversdict[usertoservermap[socket.id]].blobsdict[socket.id].name = data.name;  
				serversdict[usertoservermap[socket.id]].chatslist.push([data.chat, data.time, data.name]);

				// pseudo-scrolling of incoming chats
				if (serversdict[usertoservermap[socket.id]].chatslist.length >= 6) {
					serversdict[usertoservermap[socket.id]].chatslist.shift();
				}
			}
		);

		/// Upon users first existence
		socket.on('start',
			function(data) {
				var blob = new Blob(socket.id, socket.id, data.x, data.y, data.r);
				// spawn in lobby
				serversdict[usertoservermap[socket.id]].blobsdict[socket.id] = blob; 
			}
		);

		/// Update event is continuously received
		/// this is where checks that must be made continuously must be made
		socket.on('update',
		 	function(data) {
				serversdict[usertoservermap[socket.id]].blobsdict[socket.id].x = data.x;	
				serversdict[usertoservermap[socket.id]].blobsdict[socket.id].y = data.y;
				serversdict[usertoservermap[socket.id]].blobsdict[socket.id].r = data.r;

				// (in s) determines how long last chat stay visible under blob
				var chatDisappear1 = 5;
				var time = +new Date;

				if (time > serversdict[usertoservermap[socket.id]].blobsdict[socket.id].lastchattime+(chatDisappear1*1000)) {
					serversdict[usertoservermap[socket.id]].blobsdict[socket.id].lastchat = "";
				}  
				
				// (in s) determines how long chat stays visible in chat pane
				var chatDisappear2 = 100;
				serversdict[usertoservermap[socket.id]].chatslist = serversdict[usertoservermap[socket.id]].chatslist.filter(function(value, index, arr) {
					if (time < value[1]+(chatDisappear2*1000)) {
						return value;
					}
				});

				// check between player to player
				thisblob = serversdict[usertoservermap[socket.id]].blobsdict[socket.id];
				for (var id in serversdict[usertoservermap[socket.id]].blobsdict) {
					if (id == socket.id) {continue;} // dont collide with oneself
					if (colliding(serversdict[usertoservermap[socket.id]].blobsdict[id], thisblob)) {
						serversdict[usertoservermap[socket.id]].blobsdict[id].x
						serversdict[usertoservermap[socket.id]].blobsdict[id].y
						serversdict[usertoservermap[socket.id]].blobsdict[socket.id].x
						serversdict[usertoservermap[socket.id]].blobsdict[socket.id].y
				}}


				// check collision with currently displayed server permanents
				tblob = serversdict[usertoservermap[socket.id]].blobsdict[socket.id];
				for (var k = 0; k < serversdict[usertoservermap[socket.id]].serverpermanents.length; k++) {
					let portal = serversdict[usertoservermap[socket.id]].serverpermanents[k];	
						

					if (colliding(tblob, portal)) {
						// if we are going to game server and game server wasnt initialized
						if (portal.id == "game" && !('game' in serversdict)) {
							var chatslist = [];
							var blobsdict = {};
							var serverpermanents = [];
							// game server world permanents
							portal3 = new Blob("Portal back to Lobby", "lobby", 0, 40, 5);
							serverpermanents.push(portal3);
							// put new server in serversdict
							gameserver = new Server(blobsdict, chatslist, serverpermanents);
							serversdict['game'] = gameserver;
						}

						if (portal.id == "game") {
							console.log(socket.id + "changed room to " + portal.id);
							var oldserver = usertoservermap[socket.id];
							var newserver = portal.id;
							socket.leave(oldserver);
							socket.join(newserver);
							usertoservermap[socket.id] = newserver;
							serversdict[usertoservermap[socket.id]].blobsdict[socket.id] = serversdict[oldserver].blobsdict[socket.id];
							delete serversdict[oldserver].blobsdict[socket.id];
						}

						if (portal.id == "lobby") {
							console.log(socket.id + "changed room to " + portal.id);
							var oldserver = usertoservermap[socket.id];
							var newserver = portal.id;
							socket.leave(oldserver);
							socket.join(newserver);
							usertoservermap[socket.id] = newserver;
							serversdict[usertoservermap[socket.id]].blobsdict[socket.id] = serversdict[oldserver].blobsdict[socket.id];
							delete serversdict[oldserver].blobsdict[socket.id];
						}
					}  
				}
		 });
 

		/// Upon disconnect of user
		socket.on('disconnect', function(data) {
			console.log("Client " + serversdict[usertoservermap[socket.id]].blobsdict[socket.id].name + " has disconnected");
			// console.log("Len of dict is " + Object.keys(blobsdict).length);
		 	// delete blobsdict[socket.id];
		 	delete serversdict[usertoservermap[socket.id]].blobsdict[socket.id];
		});
  }
);


function colliding(blob1, blob2) {
	return ((blob1.r + blob2.r) > euclidianblob(blob1, blob2));
}

function euclidianblob(blob1, blob2) {
	return Math.sqrt(Math.pow(Math.abs(blob1.x - blob2.x),2)+Math.pow(Math.abs(blob1.y - blob2.y),2));
}


function vector(startx, startx, endx, endy) {
	this.startx = startx;
	this.starty = starty;
	this.endx = endx;
	this.endy = endy;
	this.magnitude = euclidian()
}



// function circlelinecollision(linestartx, linestarty, lineendx, lineendy, circlex, circley, circler) {
// 	let line = [lineendx-linestartx, lineendy-linestarty];
// 	let starttocircle = [lineendx- circlex, lineendy-circley];
// 	let dotprod = 

// }



