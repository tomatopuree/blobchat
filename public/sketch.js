
var socket;

var blob;
var blobsdict = {};
var chatslist = [];

var zoom = 1;
var input, button, greeting;

var resolutionW = 1440;
var resolutionH = 900;

function setup() {
  
  createCanvas(resolutionW, resolutionH);
  
  socket = io.connect('https://damp-citadel-76206.herokuapp.com/');

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

  blob = new Blob(socket.id, socket.id, random(width), random(height), random(8, 24));
  var data = {
    x: blob.pos.x,
    y: blob.pos.y,
    r: blob.r
  };

  socket.emit('start', data);

  socket.on('heartbeat',
    function(data) {
      chatslist = data[1];
      blobsdict = data[0];
    }
  );
}


function keyPressed() {
  if (keyCode == ENTER) {
    chatin();
  }
}

function namein() {
  // IF BUTTON SHOULD DISAPPEAR

  var name = input2.value();

  var data = {
    id: blob.id,
    name: name
  }

  socket.emit('name', data);
  button2.hide();
  input2.hide();

  button3 = createButton('Rename Character');
  button3.position((resolutionW*(0.7/20)), (resolutionH*(0.7/20)));
  button3.mousePressed(rename);
}

function rename() {
  button3.hide();
  button2.show();
  input2.show();
}

function chatin() {
  var chat = input.value();

  var time = +new Date;
  var data = {
    name: blobsdict[socket.id].name,
    chat: chat,
    time: time
  }
  
  socket.emit('chat', data);

  input.value('');
}


function draw() {
  background(200);
  // if you want stream of positions on the console
  // console.log(blob.pos.x, blob.pos.y); 

  // CHAT WINDOW
  for (var i = 0; i < chatslist.length; i++) {
    textAlign(LEFT);
    textSize(18);
    var time = +new Date;


    fill(0, 0, 0, 255);
    // // disappearing chat
    // for (var j = 10; j > 0; j--) {
    //   if (chatslist[i][1]+3000+(100*j) < time) {
    //     fill(0, 0, 0, Math.round((j/10)*255));
    //   }
    // }
    var username = chatslist[i][2];
    text(username + ": ", ~~(resolutionW*(0.6/20)), ~~((resolutionH*(16/20))+i*30));
    

    fill(255, 255, 255, 255);;
    // disappearing chat
    // for (var j = 10; j > 0; j--) {
    //   if (chatslist[i][1]+3000+(100*j) == time) {
    //     fill(255, 255, 255, Math.round((j/10)*255));
    //   }
    // }
    var userschat = chatslist[i][0];
    text(userschat, ~~(resolutionW*(0.6/20)) + textWidth(username)+8, ~~((resolutionH*(16/20))+i*30));
    }
  

  fill('red');
  textAlign(CENTER);
  textSize(10);
  // text(blob.pos.x + " : " + blob.pos.y, Math.ceil(resolutionW*(18/20)), Math.ceil(resolutionH*(18/20)));
  text(blob.pos.x + " : " + blob.pos.y, ~~(resolutionW*(18/20)), ~~(resolutionH*(19/20)));


  translate(width / 2, height / 2);
  var newzoom = 64 / blob.r;
  zoom = lerp(zoom, newzoom, 0.1);
  scale(zoom);
  translate(-blob.pos.x, -blob.pos.y);


  textSize(50);
  text(blob.pos.x + " : " + blob.pos.y, 1390, 850);

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

    // blobs[i].show();
    // if (blob.eats(blobs[i])) {
    //   blobs.splice(i, 1);
    // }
  }

  blob.show();
  if (mouseIsPressed) {
    blob.update();
  }
  blob.constrain();

  var data = {
    x: blob.pos.x,
    y: blob.pos.y,
    r: blob.r
  };
  socket.emit('update', data);


}
