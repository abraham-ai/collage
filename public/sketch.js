var resizeable = false;
var forceSquare = true;

var canv;
var gens = [];
var zoomLevel;
var zoom;
var trans = {x: 0, y: 0};;
var sel;
var selecting = false;
var active = -1;

var socket;




var textbar = false;
var input_text = '';

let input, button, greeting;



function preload() {
  canv = loadImage('2.jpg');
}

function setup() {
  createCanvas(windowWidth, windowHeight);
  socket = io.connect();
  sel = new Selection(resizeable, forceSquare);
  sel.set(0, 0, 512, 512);  
  gens = [sel];

  setZoomLevel(300);


  input = createInput();
  input.position(20, 65);

  button = createButton('submit');
  button.position(input.x + input.width, 65);
  // button.mousePressed(greet);

  greeting = createElement('h2', 'what is your name?');
  greeting.position(20, 5);





  socket.on('creation',
    function(data) {
      var pimg = new Image();
      pimg.src='data:image/jpeg;base64,'+data.creation.data;
      pimg.onload = function() {
        var img = createImage(pimg.width, pimg.height);
        img.drawingContext.drawImage(pimg, 0, 0);
        let newGen = new Selection(false, true, img);
        newGen.set(data.mouse.x, data.mouse.y, 512, 512);
        gens.push(newGen);
        //image(img, data.mouse.x, data.mouse.y);
      }
    }
  );

}

function draw() {
  background(100);
  push();
  translate(trans.x, trans.y);
  scale(zoom);
  image(canv, 0, 0);
  gens.forEach((gen, i) => {
    gen.draw(active == i);
  });
  // sel.draw();
  pop();


  if (textbar) {

    push();
    fill(255);
    translate(200, 300);
    rect(0, 0, width-400, 100);
    textSize(72);
    fill(0);
    text(input_text, 50, 84);
    pop();
  }

  // const name = input.value();
  // greeting.html('hello ' + name + '!');
  // input.value('');

  // for (let i = 0; i < 200; i++) {
  //   push();
  //   fill(random(255), 255, 255);
  //   translate(random(width), random(height));
  //   rotate(random(2 * PI));
  //   text(name, 0, 0);
  //   pop();
  // }

  
}

function setZoomLevel(z) {
  zoomLevel = constrain(z, 0, 300);
  zoom = 0.01 * pow(100, zoomLevel/300.0);
}

function mouseMoved() {
  if (selecting) {
    return;
  }
  var mx = (mouseX-trans.x)/zoom;
  var my = (mouseY-trans.y)/zoom;
  active = -1;
  for (var g=0; g<gens.length; g++) {
    if (gens[g].inside(mx, my)) {
      active = g;
    }
  }
}

function mousePressed() {
  if (selecting) {
    if (active == -1) return;
    gens[active].mousePressed(mouseX/zoom-trans.x, mouseY/zoom-trans.y);
  } 
}

function mouseDragged() {
  var mx = (mouseX-trans.x)/zoom;
  var my = (mouseY-trans.y)/zoom;
  if (selecting) {    
    if (active == -1) return;
    gens[active].mouseDragged(mx, my); 
  } else {
    trans.x = trans.x + (mouseX - pmouseX)
    trans.y = trans.y + (mouseY - pmouseY);
  }
}

function mouseReleased() {
  var mx = (mouseX-trans.x)/zoom;
  var my = (mouseY-trans.y)/zoom;
  if (active == -1) return;
  gens[active].mouseReleased(mx, my);
  // for (var g=0; g<gens.length; g++) {
  //   gens[g].mouseReleased(mx, my);
  // }
}

function keyPressed() {
  if (textbar) {
    input_text += key;
  }
  console.log("key",key)
  if (key == 'Shift') {
    selecting = true;
  }
  else if (key=='c') {
  }
  else if (key=='v') {
  }
}

function keyReleased() {
  console.log("go now", key)
  if (key == 'Shift') {
    selecting = false;
  }
  else if (key == 't') {
    textbar = true;

  }
  else if (key == 'n') {
    var mx = (mouseX-trans.x)/zoom;
    var my = (mouseY-trans.y)/zoom;
    var data = {
      text_input: 'a dinosaur with a mohawk',
      mouse: {x: mx, y: my}
    }
    socket.emit('create_new', data);
  }


  else if (key == 'q') {
    console.log("INPAINT 1")
    

    var mx = (mouseX-trans.x)/zoom;
    var my = (mouseY-trans.y)/zoom;
    console.log("INPAINT 1a")
    
    //let img_crop = get(mx, my, 512, 512);
    let img_crop = get(200, 200, 512, 512);
    console.log("INPAINT 1b")
    let img_mask = createGraphics(512, 512);
    console.log("INPAINT 1c")
    
    img_mask.background(0);
    img_mask.fill(255);
    img_mask.ellipse(256, 256, 200, 200);
    console.log("INPAINT 1d")
    
    //image(img_mask, 100, 100)

    console.log("INPAINT 1e")
    
    socket.emit('create_inpaint', {
      image: img_crop.canvas.toDataURL("image/png"),
      mask: img_mask.canvas.toDataURL("image/png"),
      mouse: {x: mx, y: my}
    });
    
    // socket.emit('create_inpaint927', {
    //   img: img_crop,
    //   mask: img_mask,
    //   mouse: {x: mx, y: my}
    // });


    console.log("INPAINT 1f")
    
    console.log("INPAINT 2")
  }
}

function mouseWheel(event) {
  if (event.deltaY > 0) {
    setZoomLevel(zoomLevel+1);
  } else if (event.deltaY < 0) {
    setZoomLevel(zoomLevel-1);
  }
}




// function setup() {
//   createCanvas(1280, 1024);
//   background(0);
  

// }

// function draw() {
  
// }

// function mouseDragged() {
  
// }
