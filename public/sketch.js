var canvas;
var patches = [];

var zoomLevel;
var zoom;
var trans = {x: 0, y: 0};;
var sel;

var prompting = false;
var selecting = false;
var alt = false;

var active = -1;


function setup() {
  hideCreationTool();
  createCanvas(windowWidth, windowHeight);
  canvas = new Canvas();
  setZoomLevel(100);

  sel = new Patch(false, true);
  sel.set(0, 0, 512, 512);
  patches = [sel];

  setupSocket();
}

function draw() {
  background(200);
  push();
  translate(trans.x, trans.y);
  scale(zoom);
  canvas.draw();
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
    canvas.drawMask(mx, my);
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
  console.log(key);
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
  
  // console.log(prompting, active);

  if (prompting) return;
  if (active == -1) return;
  
  
  if (key == 'Enter') {
    console.log("PASTE")
    canvas.paste(patches[active]);
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
    canvas.inpaint(sel);
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
  submitPrompt();
  return false;
}

