// based on code from:
// https://github.com/CodingTrain/website/tree/master/CodingChallenges/CC_032.1_agar.io

function LinkedList() {
  this.head = null;
  this.tail = null;
}
function Node(value, next, prev) {
  this.value = value;
  this.next = next;
  this.prev = prev;
}

LinkedList.prototype.addToHead = function(value) {
  const newNode = new Node(value, this.head, null);
  if (this.head) this.head.prev = newNode;
  else this.tail = newNode; 
  this.head = newNode;
};

LinkedList.prototype.removeTail = function() {
  if (!this.tail) return null;
  let value = this.tail.value;
  this.tail = this.tail.prev;
  
  if (this.tail) this.tail.next = null;
  else this.head = null;
  
  return value;
}

LinkedList.prototype.length = function() {
  let currentNode = this.head;
  let cnt = 0;

  while(currentNode) {
    if (currentNode.value == null) return cnt;
    currentNode = currentNode.next;
    cnt = cnt + 1; 
  }
  return 0;
}

LinkedList.prototype.getith = function(i) {
  let currentNode = this.head;
  let cnt = 0;

  while(currentNode) {
    if (cnt == i) return currentNode.value;
    currentNode = currentNode.next;
    cnt = cnt + 1; 
  }
  return urrentNode.value;
}

function Blob(name, id, x, y, r) {
  this.name = name;
  this.id = id;
  this.x = x;
  this.y = y;
  this.r = r;
  this.lastchat = "";
  this.lastchattime;
}

//////////////////////////////////////////////////////////////////////////////

var blobsdict = {};
var blobs = [];
// Using express: http://expressjs.com/
var express = require('express');
var app = express();

// process.env.PORT is related to deploying on heroku
var server = app.listen(process.env.PORT || 3000, listen);

// This call back just tells us that the server has started
function listen() {
  var host = server.address().address;
  var port = server.address().port;
  console.log('Example app listening at http://' + host + ':' + port);
}

app.use(express.static('public'));

var io = require('socket.io')(server);


var chatslist = [];

setInterval(heartbeat, 33);

function heartbeat() {
 	io.sockets.emit('heartbeat', [blobsdict, chatslist]);
}



// Register a callback function to run when we have an individual connection
// This is run for each individual user that connects
io.sockets.on('connection',
  // We are given a websocket object in our function
  function(socket) {

    console.log("We have a new client: " + socket.id);
    
	socket.on('name', 
    	function(data) {
    		blobsdict[socket.id].name = data.name; 
    	}
    );

    socket.on('chat', 
    	function(data) {
    		blobsdict[socket.id].lastchat = data.chat;
    		blobsdict[socket.id].lastchattime = data.time;
    		blobsdict[socket.id].name = data.name;  
    		chatslist.push([data.chat, data.time, data.name]);

    		if (chatslist.length == 6) {
      			chatslist.shift();
    		}
    	}
    );

    socket.on('start',
      function(data) {
        console.log(socket.id + " " + data.x + " " + data.y + " " + data.r);
        var blob = new Blob(socket.id, socket.id, data.x, data.y, data.r);
        
        blobsdict[socket.id] = blob;
      }
    );

    socket.on('update',
      function(data) {

		blobsdict[socket.id].x = data.x;	
        blobsdict[socket.id].y = data.y;
        blobsdict[socket.id].r = data.r;

        var time = +new Date;
        var chatDisappear = 5000;

        if (time > blobsdict[socket.id].lastchattime+chatDisappear) {
			blobsdict[socket.id].lastchat = "";
		}  
    	chatslist = chatslist.filter(function(value, index, arr) {
		if (time < value[1]+chatDisappear) {
			return value;
		}

		});

      }
    );



    socket.on('disconnect', function(data) {

      delete blobsdict[socket.id];

      // console.log("Len of dict is " + Object.keys(blobsdict).length);
      console.log("Client " + socket.id + " has disconnected");
    });
  }
);
