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


var prompting = false;
var selecting = false;
var alt = false;


var active = -1;

var socket;




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
  
  

function run_creation(data) {
  var pimg = new Image();
  pimg.src='data:image/jpeg;base64,'+data.creation.data;
  pimg.onload = function() {
    var img = createImage(pimg.width, pimg.height);
    img.drawingContext.drawImage(pimg, 0, 0);
    let newPatch = new Patch(false, true, img);
    newPatch.set(data.position.x, data.position.y, 512, 512);
    patches.push(newPatch);
  }
}

function run_inpainting(data) {
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


var initImg;

function preload() {
  initImg = loadImage("2.jpg");

}

function setup() {
  hideCreationTool();
  createCanvas(windowWidth, windowHeight);
  canv = new Canvas();
  setZoomLevel(100);

  sel = new Patch(resizeable, forceSquare);
  sel.set(0, 0, 512, 512);
  patches = [sel];

  let newPatch = new Patch(false, true, initImg);
  newPatch.set(0, 0, initImg.width, initImg.height);
  patches.push(newPatch);

  socket = io.connect();
  socket.on('creation', run_creation);
  socket.on('inpainting', run_inpainting);
}

function draw() {
  background(200);
  push();
  translate(trans.x, trans.y);
  scale(zoom);
  canv.draw();
  patches.forEach((patch, i) => {
    patch.draw(active == i);
  });
  sel.draw();
  pop();
}

function setZoomLevel(z) {
  zoomLevel = constrain(z, 0, 100);
  zoom = 0.01 * pow(100, zoomLevel/100.0);
}

function mouseMoved() {
  if (selecting || prompting) {
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
  if (prompting) return;
  if (selecting) {
    if (active == -1) return;
    patches[active].mousePressed(mouseX/zoom-trans.x, mouseY/zoom-trans.y);
  } 
}

function mouseDragged() {
  if (prompting) return;
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
  if (prompting) return;
  var mx = (mouseX-trans.x)/zoom;
  var my = (mouseY-trans.y)/zoom;
  if (active == -1) return;
  patches[active].mouseReleased(mx, my);
}

function keyPressed() {
  if (key == 'Tab') {
    toggleCreationTool();
    return;
  }
  else if (key == 'Shift') {
    selecting = true;
    return;
  }
  else if (key == 'Meta') {
    alt = true;
    return;
  }
  
  if (prompting) return;
  if (active == -1) return;
  
  if (key == 'Enter') {
    canv.paste(patches[active]);
  }
  else if (key == 'Backspace') {
    patches.splice(active, 1);
  }
}

function keyReleased() {
  if (key == 'Shift') {
    selecting = false;
    return;
  }
  else if (key == 'Meta') {
    alt = false;
    return;
  } 
  else if (key == 'q') {
    canv.inpaint(sel);
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

function showCreationTool() {
  prompting = true;
  document.getElementById('creationTool').style.visibility = 'visible';
}

function hideCreationTool() {
  prompting = false;
  document.getElementById('creationTool').style.visibility = 'hidden';
}

function toggleCreationTool() {
  if (prompting) {
    hideCreationTool();
  } else {
    showCreationTool();
  }
}

function mySubmitFunction(e) {
  e.preventDefault();
  hideCreationTool();
  let prompt = document.getElementById("prompt");
  var mx = (trans.x+width/2-256)/zoom;
  var my = (trans.y+height/2-256)/zoom;
  var data = {
    text_input: prompt.value,
    position: {x: mx, y: my}
  }
  socket.emit('create', data);
  prompt.value = '';
  return false;
}

