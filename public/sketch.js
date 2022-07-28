// X copy functionality
// x save
// x scroll zoom recenter
// x fix background 
// bug: copy/erase never shows up
// status message for inpainting
// borders (green for progress bar, vibrating hue for patch)
// erase functionality
// ------
// tutorial video
// undo/redo



var canvas = null;
var patches = [];
var menu = [];
var selector = null;

var mouse = {x: 0, y: 0};
var anchor = {x: 0, y: 0};
var trans = {x: 0, y: 0};
var t1 = {x: 0, y: 0};
var t2 = {x: 0, y: 0};

var mouseRaw = {x: 0, y: 0};
var zoomLevel = 100;
var zoom = 1;

var overlay = false;
var shift = false;
var cmd = false;

var imgIcon;
var isFileDragging = false;


function preload() {
  imgIcon = loadImage("imageicon.png");  
}

function setup() {
  let cp5 = createCanvas(windowWidth, windowHeight);
  cp5.drop(fileDropped);
  cp5.dragOver(fileDragging);
  
  canvas = new Canvas();
  selector = null;
  
  setZoomLevel(zoomLevel);
  setupSocket();
  setupMenu();
}

function setupMenu() {
  let bSave = new Button(null, "Save", this.exportCanvas);
  //let bUndo = new Button(null, "Undo", this.undo);
  let bHelp = new Button(null, "Help", this.help);
  bSave.set(5, 5, 120, 30);
  // bUndo.set(130, 5, 120, 30);
  bHelp.set(/*255*/130, 5, 120, 30);
  menu = [bSave, /*bUndo,*/ bHelp];
}

function exportCanvas() {
  canvas.save("Canvas.png");
}

function undo() {
  console.log("UNDO!");
}

function help() {
  showHelp();
}

function drawBackground() {
  var margin = 24;

  var x1 = -trans.x/zoom;
  var y1 = -trans.y/zoom;
  var x2 = (width-trans.x)/zoom;
  var y2 = (height-trans.y)/zoom;

  var left = Math.ceil(x1 / margin)-1;
  var top = Math.ceil(y1 / margin)-1;
  var right = Math.ceil(x2 / margin)+1;
  var bottom = Math.ceil(y2 / margin)+1;

  var filledy = (left+(top%2))%2 == 0;
  for (var j=top; j<bottom; j++) {
    filledy = !filledy;
    let filled = filledy;
    for (var i=left; i<right; i++) {
      var x = i * margin;
      var y = j * margin;
      noStroke();
      fill(filled ? 155 : 225, 100);
      rect(x, y, margin, margin)
      filled = !filled;
    }
  }
}

function draw() {
  background(255);
 
  push();

  translate(trans.x, trans.y);
  scale(zoom);
 
  drawBackground();
  canvas.draw();
  
  patches.forEach((patch) => {
    patch.draw();
  });
 
  if (selector) {
    selector.draw();
  }

  if (isFileDragging){
    imageMode(CENTER);
    image(imgIcon, mouse.x, mouse.y);
  }

  pop();

  for (var b=0; b<menu.length; b++) {
    menu[b].draw();
  }

}

function setZoomLevel(z) {
  zoomLevel = constrain(z, 0, 120);
  zoom = 0.01 * pow(100, zoomLevel/100.0);
  trans.x = mouseRaw.x - mouse.x * zoom;
  trans.y = mouseRaw.y - mouse.y * zoom;
}

function updateMouse() {
  mouseRaw.x = mouseX;
  mouseRaw.y = mouseY;
  mouse.x = (mouseX-trans.x)/zoom;
  mouse.y = (mouseY-trans.y)/zoom;
}

function mouseMoved() {
  updateMouse();

  for (var b=0; b<menu.length; b++) {
    menu[b].mouseMoved(mouseRaw);
  }

  for (var p=0; p<patches.length; p++) {
    patches[p].mouseMoved(mouse);
  }

  if (selector) {
    selector.mouseMoved(mouse);
  }
}

function mousePressed() {
  if (overlay) return;
  
  updateMouse();

  if (keyIsDown(SHIFT)) {
    anchor.x = trans.x;
    anchor.y = trans.y;
    t1.x = mouseRaw.x;
    t1.y = mouseRaw.y;
    return;
  }

  if (selector) {
    if (selector.mousePressed(mouse)) {
      return;
    }
  }
  
  for (var b=0; b<menu.length; b++) {
    if (menu[b].mousePressed(mouseRaw)) {
      return;
    }
  }
  
  for (var p=0; p<patches.length; p++) {
    if (patches[p].mousePressed(mouse)) {
      return;
    }
  }
  
  if (!selector) {
    selector = new Selection(true, true, false, null);
  }
  selector.mousePressed(mouse);
}

function mouseDragged() {
  if (overlay) return;

  updateMouse();

  if (keyIsDown(SHIFT)) {
    t2.x = mouseRaw.x;
    t2.y = mouseRaw.y;
    trans.x = anchor.x + (t2.x - t1.x);
    trans.y = anchor.y + (t2.y - t1.y);
  }
  else if (keyIsDown(91)) {
    canvas.drawMask(mouse.x, mouse.y);
  }
  else {
    if (selector) {
      selector.mouseDragged(mouse); 
    }
    for (var p=0; p<patches.length; p++) {
      if (patches[p].mouseDragged(mouse)) {
        return;
      }
    }
  }
}

function mouseReleased() {
  if (overlay) return;
  
  updateMouse();

  if (selector) {
    selector.mouseReleased(mouse);
  }

  for (var b=0; b<menu.length; b++) {
    menu[b].mouseReleased(mouseRaw);
  }

  for (var p=0; p<patches.length; p++) {
    patches[p].mouseReleased(mouse);
  }

}

function keyPressed() {
  if (overlay) {
    if (key == 'Escape') {
      hideCreationTool();
      hideHelp();
    }
    return;
  }
}

function keyReleased() {
  if (overlay) {
    return;
  }
}

function mouseWheel(event) {
  if (event.deltaY > 0) {
    setZoomLevel(zoomLevel-1);
  } 
  else if (event.deltaY < 0) {
    setZoomLevel(zoomLevel+1);
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}

function showCreationTool() {
  overlay = true;
  document.getElementById('creationTool').style.visibility = 'visible';
}

function hideCreationTool() {
  overlay = false;
  document.getElementById('creationTool').style.visibility = 'hidden';
}

function showHelp() {
  overlay = true;
  document.getElementById('help').style.visibility = 'visible';
}

function hideHelp() {
  overlay = false;
  document.getElementById('help').style.visibility = 'hidden';
}

function mySubmitFunction(e) {
  e.preventDefault();
  hideCreationTool();
  submitPrompt();
  return false;
}
