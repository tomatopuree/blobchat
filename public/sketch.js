function Server(blobsdict, chatslist, serverpermanents) {
  this.blobsdict = blobsdict;
  this.chatslist = chatslist;
  this.serverpermanents = serverpermanents;
}

currentserver = new Server(blobsdict = {}, chatslist = [], serverpermanents = []);

// use above



var socket;

var blob;
var blobsdict = {};
var chatslist = [];
var serverpermanents = [];

var zoom = 1;
var input, button, greeting;

var resolutionW = 1440;
var resolutionH = 900;

function setup() {
  
  createCanvas(resolutionW, resolutionH);
  
  // socket = io.connect('https://damp-citadel-76206.herokuapp.com/');
  socket = io.connect('http://localhost:3000');

  // CHAT INPUT
  input = createInput();
  input.position((resolutionW*(0.7/20)), (resolutionH*(19.1/20)));

  button = createButton('Enter');
  button.position(input.x + input.width, (resolutionH*(19.1/20)));
  button.mousePressed(chatin);

  // NAME INPUT
  input2 = createInput();
  input2.position((resolutionW*(0.7/20)), (resolutionH*(0.7/20)));

  button2 = createButton('Submit Name');
  button2.position(input2.x + input.width, (resolutionH*(0.7/20)));
  button2.mousePressed(namein);

  textAlign(CENTER);
  textSize(50);

  // MAKE BLOB
  blob = new Blob(socket.id, socket.id, 0, 0, random(18,24));
  var data = {
    x: blob.pos.x,
    y: blob.pos.y,
    r: blob.r
  };

  socket.emit('start', data);

  socket.on('heartbeat',
    function(data) {
      console.log(data);
      chatslist = data.chatslist;
      blobsdict = data.blobsdict;
      serverpermanents = data.serverpermanents;
    }
  );
}



function draw() {
  background(200);




  // DRAW CHAT WINDOW
  for (var i = 0; i < chatslist.length; i++) {
    textAlign(LEFT);
    textSize(18);
    var time = +new Date;

    fill(0, 0, 0, 255);

    var username = chatslist[i][2];
    text(username + ": ", ~~(resolutionW*(0.6/20)), ~~((resolutionH*(16/20))+i*30));
    
    fill(255, 255, 255, 255);;

    var userschat = chatslist[i][0];
    text(userschat, ~~(resolutionW*(0.6/20)) + textWidth(username)+8, ~~((resolutionH*(16/20))+i*30));
    }
  

  fill('red');
  textAlign(CENTER);
  textSize(10);
  text(blob.pos.x + " : " + blob.pos.y, ~~(resolutionW*(18/20)), ~~(resolutionH*(19/20)));

  textAlign(CENTER);
  textSize(10);
  text("Number of currently online: " + Object.keys(blobsdict).length, ~~(resolutionW*(18/20)), ~~(resolutionH*(18.5/20)));


  // Anything before this chunk of code will be anchored to "camera"
  // Anything after this chunk of code will not be anchored to "camera"
  // "camera" follows blob, scale w/ size
  translate(width / 2, height / 2);
  var newzoom = 64 / blob.r;
  zoom = lerp(zoom, newzoom, 0.1);
  scale(zoom);
  translate(-blob.pos.x, -blob.pos.y);


  // Draw names and chats
  for (var keyy in blobsdict) {
    var id = socket.id;

    fill(0, 0, 255);
    ellipse(blobsdict[keyy].x, blobsdict[keyy].y, blobsdict[keyy].r * 2, blobsdict[keyy].r * 2);

    textAlign(CENTER);
    textSize(4);
    fill(255);
    text(blobsdict[keyy].lastchat, blobsdict[keyy].x, blobsdict[keyy].y + blobsdict[keyy].r + 4);
    fill(0);
    text(blobsdict[keyy].name, blobsdict[keyy].x, blobsdict[keyy].y - (blobsdict[keyy].r+2));

  }




  //  create world using server permanents
  // for (var k = 0; k < serverpermanents.length; k++) {

  //   // portal & portaltext
  //   fill(255);
  //   ellipse(serverpermanents[k].pos.x, serverpermanents[k].pos.y, serverpermanents[k].r, serverpermanents[k].r);
  //   fill('blue');
  //   textAlign(CENTER);
  //   textSize(6);
  //   text(serverpermanents[k].name, serverpermanents[k].pos.x-1, -5);
  // }


  blob.show();
  if (mouseIsPressed) {
    blob.updatepos();
  }
  blob.constrain();

  var data = {
    x: blob.pos.x,
    y: blob.pos.y,
    r: blob.r
  };
  socket.emit('update', data);



  


}







//////////// BUTTONS AND KEY PRESSES

/// Handles all key presses
function keyPressed() {
  if (keyCode == ENTER) {
    chatin();
  }
  if (keyCode == UP_ARROW) {
    console.log("uparrow");
    var data = {message: "toGame"};
    socket.emit('serverchange', data);
  }
}

///  name input, sends name to server
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

/// helper
function rename() {
  button3.hide();
  button2.show();
  input2.show();
}

/// chat input, sends chat to server
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