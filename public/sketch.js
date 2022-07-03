
var socket;

function setup() {
  createCanvas(500, 500);
  background(0);
  
  socket = io.connect();  
  
  socket.on('mouse2',
    function(data) {
      console.log("Got: " + data.x + " " + data.y);
      fill(0,0,255);
      noStroke();
      ellipse(data.x,data.y,80,80);
    }
  );

}

function draw() {
  ellipse(100, 100, 100, 100);
}

function mouseDragged() {
  fill(255);
  noStroke();
  ellipse(mouseX, mouseY, 80, 80);
  sendmouse(mouseX, mouseY);
}

function sendmouse(xpos, ypos) {
  console.log("sendmouse: " + xpos + " " + ypos);
  
  var data = {x: xpos, y: ypos};

  socket.emit('mouse',data);
}