
var socket = io.connect();

function setup() {
  createCanvas(1280, 1024);
  background(0);
  
  socket.on('creation',
    function(data) {
      console.log(data);
      console.log(data.creation);
      console.log(data.mouse);

      var pimg = new Image();
      pimg.src='data:image/jpeg;base64,'+data.creation.data;
      pimg.onload = function() {
        var img = createImage(pimg.width, pimg.height);
        img.drawingContext.drawImage(pimg, 0, 0);
        image(img, data.mouse.x, data.mouse.y);
      }
    }
  );

}

function draw() {
  
}

function mouseDragged() {
  
}

function keyPressed() {
  if (key==' '){
    var data = {
      text_input: 'a dinosaur with a mohawk',
      mouse: {x: mouseX, y: mouseY}    
    }
    socket.emit('create_new', data);
  }
}
