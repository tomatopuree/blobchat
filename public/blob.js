function Blob(name, id, x, y, r) {
  this.lastchat = "";
  this.lastchattime;
  this.name = name;
  this.id = id;
  this.pos = createVector(x, y);
  this.r = r;
  this.vel = createVector(0, 0);

  /// update position and smooth velocity
  this.updatepos = function() {
    var newvel = createVector(mouseX - width / 2, mouseY - height / 2).div(50);
    // this is the speed limit
    newvel.limit(1);
    this.vel.lerp(newvel, 0.2);
    this.pos.add(this.vel);
  }

  // here for salvaging
  this.eats = function(other) {
    var d = p5.Vector.dist(this.pos, other.pos);
    if (d < this.r + other.r) {
      var sum = PI * this.r * this.r + PI * other.r * other.r;
      this.r = sqrt(sum / PI);
      //this.r += other.r;
      return true;
    } else {
      return false;
    }
  }

  /// constrain 2nd, 3rd argument is the constraint of variable
  this.constrain = function() {
    blob.pos.x = constrain(blob.pos.x, -width / 4, width / 4);
    blob.pos.y = constrain(blob.pos.y, -height / 4, height / 4);
  }

  /// draw it!
  this.show = function() {
    fill(255);
    ellipse(this.pos.x, this.pos.y, this.r * 2, this.r * 2);
  }
}


