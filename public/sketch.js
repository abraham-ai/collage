// let pg1, pg2, pg;

// function setup() {
//   createCanvas(20000, 1000);
//   pg1 = createGraphics(512, 512);
//   pg2 = createGraphics(512, 512);
//   pg = createGraphics(512, 512);

//   pg1.background(255, 0, 0);
//   for (var i=0; i<100; i++) {
//     pg1.fill(random(255), random(255), random(255));
//     pg1.ellipse(random(512), random(512), 100);
//   }

//   pg2.background(0);
//   pg2.fill(255);
//   pg2.ellipse(256, 256, 300, 300);

//   pg.push();
//   pg.blendMode(BLEND)
//   pg.image(pg1, 0, 0);
//   pg.blendMode(ADD)
//   pg.image(pg2, 0, 0);
//   pg.pop();


// }

// function draw() {

//   background(0);
//   image(pg1, mouseX+512, mouseY);
//   image(pg2, mouseX+1024, mouseY);
//   image(pg, mouseX, mouseY);

// }

var resizeable = false;
var forceSquare = true;

var canv;
var patches = [];
var zoomLevel;
var zoom;
var trans = {x: 0, y: 0};;
var sel;


var selecting = false;
var alt = false;


var active = -1;

var socket;




var textbar = false;
var input_text = '';

let input, button, greeting;


class Canvas {

  constructor() {
    this.min = {x:1e8, y:1e8};
    this.max = {x:-1e8, y:-1e8};
    this.pg = null;
    this.pgMask = null;
  }
      
  paste(patch) {
    let minx = min(this.min.x, patch.x);
    let miny = min(this.min.y, patch.y);
    let maxx = max(this.max.x, patch.x+patch.w);
    let maxy = max(this.max.y, patch.y+patch.h);

    let pgNew = createGraphics(maxx-minx, maxy-miny);
    let pgMaskNew = createGraphics(maxx-minx, maxy-miny);
    
    pgNew.push();
    pgNew.background(255, 0, 0);
    if (this.pg) {
      pgNew.image(this.pg, this.min.x-minx, this.min.y-miny);
    }
    pgNew.fill(255);
    pgNew.image(patch.img, patch.x-minx, patch.y-miny, patch.w, patch.h);
    pgNew.pop();

    pgMaskNew.push();
    pgMaskNew.background(0);
    if (this.pgMask) {
      pgMaskNew.image(this.pgMask, this.min.x-minx, this.min.y-miny);
    }
    pgMaskNew.fill(0);
    pgMaskNew.noStroke();
    pgMaskNew.rect(patch.x-minx, patch.y-miny, patch.w, patch.h);
    pgMaskNew.pop();

    this.pg = pgNew;
    this.pgMask = pgMaskNew;
    this.min = {x: minx, y:miny};
    this.max = {x: maxx, y:maxy};
  }

  draw() {
    if (!this.pg) return;
    push();
    blendMode(BLEND);
    translate(this.min.x, this.min.y);
    image(this.pg, 0, 0);
    blendMode(ADD);
    image(this.pgMask, 0, 0);
    pop();
  }

  drawMask(mx, my) {
    if (!this.pgMask) return;
    this.pgMask.fill(255);
    this.pgMask.noStroke();
    this.pgMask.ellipse(mx-this.min.x, my-this.min.y, 50, 50);
  }

  inpaint(sel) {
    let img_crop = this.pg.get(sel.x-this.min.x, sel.y-this.min.y, sel.w, sel.h);
    let img_mask = this.pgMask.get(sel.x-this.min.x, sel.y-this.min.y, sel.w, sel.h);
    socket.emit('inpaint', {
      image: img_crop.canvas.toDataURL("image/png"),
      mask: img_mask.canvas.toDataURL("image/png"),
      selection: sel
    });
  }  
}
  
  

var initImg;

function preload() {
  initImg = loadImage("2.jpg");

}

function setup() {
  createCanvas(windowWidth, windowHeight);

  canv = new Canvas();


  socket = io.connect();
  sel = new Patch(resizeable, forceSquare);
  sel.set(0, 0, 512, 512);

  patches = [sel];

  setZoomLevel(100);


  input = createInput();
  input.position(20, 65);
  button = createButton('submit');
  //button.position(input.x + input.width, 65);
  // button.mousePressed(greet);

  greeting = createElement('h1', 'what is your name?');
  greeting.position(20, 5);



  let newPatch = new Patch(false, true, initImg);
  newPatch.set(0, 0, initImg.width, initImg.height);
  patches.push(newPatch);


  socket.on('creation',
    function(data) {
      var pimg = new Image();
      pimg.src='data:image/jpeg;base64,'+data.creation.data;
      pimg.onload = function() {
        var img = createImage(pimg.width, pimg.height);
        img.drawingContext.drawImage(pimg, 0, 0);
        let newPatch = new Patch(false, true, img);
        newPatch.set(data.mouse.x, data.mouse.y, 512, 512);
        patches.push(newPatch);
      }
    }
  );

  socket.on('inpainting',
    function(data) {
      var pimg = new Image();
      pimg.src='data:image/jpeg;base64,'+data.creation.data;
      pimg.onload = function() {
        var img = createImage(pimg.width, pimg.height);
        img.drawingContext.drawImage(pimg, 0, 0);
        let newPatch = new Patch(false, true, img);
        newPatch.set(data.selection.x, data.selection.y, data.selection.w, data.selection.h);
        canv.paste(newPatch);
      }
    }
  );

}

function draw() {
  background(200);
  push();
  translate(trans.x, trans.y);
  scale(zoom);
  //image(canv, 0, 0);
  canv.draw();
  patches.forEach((patch, i) => {
    patch.draw(active == i);
  });
  sel.draw();
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
  zoomLevel = constrain(z, 0, 100);
  zoom = 0.01 * pow(100, zoomLevel/100.0);
}

function mouseMoved() {
  if (selecting) {
    return;
  }
  var mx = (mouseX-trans.x)/zoom;
  var my = (mouseY-trans.y)/zoom;
  active = -1;
  for (var p=0; p<patches.length; p++) {
    if (patches[p].inside(mx, my)) {
      active = p;
    }
  }
}

function mousePressed() {
  if (selecting) {
    if (active == -1) return;
    patches[active].mousePressed(mouseX/zoom-trans.x, mouseY/zoom-trans.y);
  } 
}

function mouseDragged() {
  var mx = (mouseX-trans.x)/zoom;
  var my = (mouseY-trans.y)/zoom;
  if (selecting) {    
    if (active == -1) return;
    patches[active].mouseDragged(mx, my); 
  } 
  else if (alt) {
    canv.drawMask(mx, my);
  }
  else {
    trans.x = trans.x + (mouseX - pmouseX)
    trans.y = trans.y + (mouseY - pmouseY);
  }
}

function mouseReleased() {
  var mx = (mouseX-trans.x)/zoom;
  var my = (mouseY-trans.y)/zoom;
  if (active == -1) return;
  patches[active].mouseReleased(mx, my);
}

function keyPressed() {
  console.log("key",key)

  if (key == 'Shift') {
    selecting = true;
    return;
  }
  if (key == 'Meta') {
    alt = true;
    return;
  }
  
  if (active == -1) return;

  if (key == 'Enter') {
    canv.paste(patches[active]);
  }
  else if (key == 'Backspace') {
    patches.splice(active, 1);
  }



}

function keyReleased() {
  console.log("go now", key)
  if (key == 'Shift') {
    selecting = false;
  }
  else if (key == 'Meta') {
    alt = false;
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
    socket.emit('create', data);
  }


  else if (key == 'q') {
    console.log("INPAINT 1")
    
    
    canv.inpaint(sel);

    var mx = (mouseX-trans.x)/zoom;
    var my = (mouseY-trans.y)/zoom;
    // console.log("INPAINT 1a")
    
    // //let img_crop = get(mx, my, 512, 512);
    // let img_crop = get(200, 200, 512, 512);
    // console.log("INPAINT 1b")
    // let img_mask = createGraphics(512, 512);
    // console.log("INPAINT 1c")
    
    // img_mask.background(0);
    // img_mask.fill(255);
    // img_mask.ellipse(256, 256, 200, 200);
    // console.log("INPAINT 1d")
    
    // //image(img_mask, 100, 100)

    // console.log("INPAINT 1e")
    
    /*
    socket.emit('create_inpaint', {
      image: img_crop.canvas.toDataURL("image/png"),
      mask: img_mask.canvas.toDataURL("image/png"),
      mouse: {x: mx, y: my}
    });
    */
    
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

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}
  