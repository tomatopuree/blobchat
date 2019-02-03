function Blob(name, id, x, y, r) {
	this.lastchat = "";
	this.lastchattime;
	this.name = name;
	this.id = id;
	this.pos = createVector(x, y);
	this.r = r;
	this.vel = createVector(0, 0);

	/// update position and smooth velocity
	this.update_position = function() {
		var newvel = createVector(mouseX - width / 2, mouseY - height / 2).div(50);
		// this is the speed limit
		newvel.limit(1);
		this.vel.lerp(newvel, 0.2);
		this.pos.add(this.vel);
	}

	this.show_and_constrain_this_blob = function() {
		blob.pos.x = constrain(blob.pos.x, -width / 4, width / 4);
		blob.pos.y = constrain(blob.pos.y, -height / 4, height / 4);
		fill(255);
		ellipse(this.pos.x, this.pos.y, this.r * 2, this.r * 2);
	}
}

function Server(blobsdict, chatslist, serverpermanents) {
	this.blobsdict = blobsdict;
	this.chatslist = chatslist;
	this.serverpermanents = serverpermanents;
}

currentserver = new Server(blobsdict = {}, chatslist = [], serverpermanents = []);

var socket;

var blob;
var currentservername;
var blobsdict = {};
var chatslist = [];
var serverpermanents = [];

var zoom = 1;
var input, button, greeting;

var resolutionW = 1400;
var resolutionH = 800;


function setup() {
	
	createCanvas(resolutionW, resolutionH);
	
	// socket = io.connect('https://damp-citadel-76206.herokuapp.com/');
	socket = io.connect('http://localhost:3000');

	create_chat_pane();

	create_name_pane();

	blob = new Blob(socket.id, socket.id, 0, 0, random(18,24));
	var data = {
		x: blob.pos.x,
		y: blob.pos.y,
		r: blob.r
	};

	socket.emit('start', data);

	socket.on('heartbeat',
		function(data) {
			chatslist = data[0].chatslist;
			blobsdict = data[0].blobsdict;
			serverpermanents = data[0].serverpermanents;
			currentservername = data[1];
		}
	);
}

function draw() {
	
	background(200);

	draw_chat_pane();
	
	draw_metadata();

	// Anything before below chunk of code will be anchored to "camera"
	// Anything after below chunk of code will not be anchored to "camera"
	// "camera" follows blob, scale w/ size

	// put blob in middle
	translate(width / 2, height / 2);
	// how much zoom and how fast zoom
	zoom = lerp(zoom, 64 / blob.r, 0.1);
	scale(zoom);
	// camere follow
	translate(-blob.pos.x, -blob.pos.y);

	draw_other_blobs();

	draw_server_permanents();

	blob.show_and_constrain_this_blob();
	if (mouseIsPressed) {
		blob.update_position();
	}

	var data = {
		x: blob.pos.x,
		y: blob.pos.y,
		r: blob.r
	};
	socket.emit('update', data);
}



////////////////////////////////////////////////////
////////////////// SETUP FUNCTIONS //////////////////
////////////////////////////////////////////////////

// doesn't scroll, regular form
function create_chat_pane() {
	input = createInput();
	input.position((resolutionW*(0.7/20)), (resolutionH*(19.1/20)));

	button = createButton('Enter');
	button.position(input.x + input.width, (resolutionH*(19.1/20)));
	button.mousePressed(chatin);
}

// cycling panes
function create_name_pane() {
	input2 = createInput();
	input2.position((resolutionW*(0.7/20)), (resolutionH*(0.7/20)));

	button2 = createButton('Submit Name');
	button2.position(input2.x + input2.width, (resolutionH*(0.7/20)));
	button2.mousePressed(namein);

	textAlign(CENTER);
	textSize(50);
}

/// handles all key presses
function keyPressed() {
	if (keyCode == ENTER) {
		chatin();
	}
}

/// sends chat to server
function chatin() {
	var chat = input.value();

	var time = +new Date;
	var data = {
		name: blobsdict[socket.id].name,
		chat: chat,
		time: time
	};
	
	socket.emit('chat', data);

	input.value('');
}

///  sends name to server
function namein() {
	var name = input2.value();

	var data = {
		id: blob.id,
		name: name
	};

	socket.emit('name', data);
	button2.hide();
	input2.hide();

	button3 = createButton('Rename Character');
	button3.position((resolutionW*(0.7/20)), (resolutionH*(0.7/20)));
	button3.mousePressed(rename);
}

// from rename state to original state 
function rename() {
	button3.hide();
	button2.show();
	input2.show();
}



////////////////////////////////////////////////////
////////////////// DRAW FUNCTIONS //////////////////
////////////////////////////////////////////////////

// update with chats
function draw_chat_pane() {
	for (var i = 0; i < chatslist.length; i++) {
		textAlign(LEFT);
		textSize(18);

		fill(0, 0, 0, 255);

		var username = chatslist[i][2];
		text(username + ": ", ~~(resolutionW*(0.6/20)), ~~((resolutionH*(16/20))+i*30));
		
		fill(255, 255, 255, 255);;

		var userschat = chatslist[i][0];
		text(userschat, ~~(resolutionW*(0.6/20)) + textWidth(username)+8, ~~((resolutionH*(16/20))+i*30));
	}
}

// update with metadatas
function draw_metadata() {
	fill('red');
	textAlign(CENTER);
	textSize(10);

	// room name
	text("In room " + currentservername, ~~(resolutionW*(18/20)), ~~(resolutionH*(18/20)));

	// people in room
	text("People in room: " + Object.keys(blobsdict).length, ~~(resolutionW*(18/20)), ~~(resolutionH*(18.5/20)));

	// coordinates
	text(blob.pos.x + " : " + blob.pos.y, ~~(resolutionW*(18/20)), ~~(resolutionH*(19/20)));
}

// update with other blob info
function draw_other_blobs() {
	for (var keyy in blobsdict) {
		fill(0, 0, 255);
		ellipse(blobsdict[keyy].x, blobsdict[keyy].y, blobsdict[keyy].r * 2, blobsdict[keyy].r * 2);

		textAlign(CENTER);
		textSize(4);
		fill(255);
		text(blobsdict[keyy].lastchat, blobsdict[keyy].x, blobsdict[keyy].y + blobsdict[keyy].r + 4);
		
		fill(0);
		text(blobsdict[keyy].name, blobsdict[keyy].x, blobsdict[keyy].y - (blobsdict[keyy].r+2));
	}
}

// update with non-blob server permanents
function draw_server_permanents() {
	//  create world using server permanents
	for (var k = 0; k < serverpermanents.length; k++) {
		// portal & portaltext
		fill(255);
		ellipse(serverpermanents[k].x, serverpermanents[k].y, serverpermanents[k].r, serverpermanents[k].r);
		
		fill('blue');
		textAlign(CENTER);
		textSize(6);
		text(serverpermanents[k].name, serverpermanents[k].x-1, -5);
	}
}