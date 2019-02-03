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
}

function Server(blobsdict, chatslist, serverpermanents) {
	this.blobsdict = blobsdict;
	this.chatslist = chatslist;
	this.serverpermanents = serverpermanents;
}

var serversdict = {};
var usertoservermap = {};

/// Register a callback function upon each individual connection
io.sockets.on('connection',
	function(socket) {
		// there is no way to access socket's room inherently in socket.io. 
		// that's why socket.join and socket.leave aren't enough, we need
		// usertoservermap to keep track of a map of user to server
		// and dynamically update it
		socket.join('lobby');

		// keep track of which server this guy is connected to
		usertoservermap[socket.id] = 'lobby';

		// no one's here so make the lobby
		if (Object.keys(serversdict).length == 0 && !('lobby' in serversdict)) {
			// lobby server permanents
			var serverpermanents = [];
			portal1 = new Blob("Portal to Game", "togame", 150, 0, 5);
			portal2 = new Blob("Portal to Room #2", "toroomtwo", -150, 0, 5);
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

				// check collision with currently displayed server permanents
				tblob = serversdict[usertoservermap[socket.id]].blobsdict[socket.id];
				for (var k = 0; k < serversdict[usertoservermap[socket.id]].serverpermanents.length; k++) {
					portal1 = serversdict[usertoservermap[socket.id]].serverpermanents[k];
					if ((portal1.r + tblob.r) > (Math.sqrt(Math.pow(Math.abs(tblob.x - portal1.x),2)+Math.pow(Math.abs(tblob.y - portal1.y),2)))) {
						// if we are going to game server and game server wasnt initialized
						if (portal1.id == "togame" && !('game' in serversdict)) {
							var chatslist = [];
							var blobsdict = {};
							var serverpermanents = [];
							// game server world permanents
							portal3 = new Blob("Portal back to Lobby", "tolobby", 0, 40, 5);
							serverpermanents.push(portal3);
							// put new server in serversdict
							gameserver = new Server(blobsdict, chatslist, serverpermanents);
							serversdict['game'] = gameserver;
						}

						if (portal1.id == "togame") {
							socket.leave('lobby');
							socket.join('game');
							usertoservermap[socket.id] = 'game';
							// put blob in new server
							serversdict[usertoservermap[socket.id]].blobsdict[socket.id] = serversdict['lobby'].blobsdict[socket.id];
							// take blob off old server
							delete serversdict['lobby'].blobsdict[socket.id];
						}

						if (portal1.id == "tolobby") {
							socket.leave('game');
							socket.join('lobby');
							usertoservermap[socket.id] = 'lobby';
							// put blob in new server
							serversdict[usertoservermap[socket.id]].blobsdict[socket.id] = serversdict['game'].blobsdict[socket.id];
							// take blob off old server
							delete serversdict['game'].blobsdict[socket.id];
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




