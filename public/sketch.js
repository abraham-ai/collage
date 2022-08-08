// x optimization
// x resizing canvas bug
// x optimize background
// x disable scroll
// draw border limit
// inpainting bug
// resizing patches
// eraser draw in a line (edge strokes?)
// ------
// tutorial video
// undo/redo


const CREATION_AREA_MAXIMUM = 720000;
const BG_RECT_SIZE = 32;

let canvas = null;
let patches = [];
let menu = [];
let selector = null;
let pgBg;

let mouseRaw = {x: 0, y: 0};
let mouse = {x: 0, y: 0};
let anchor = {x: 0, y: 0};
let trans = {x: 0, y: 0};
let t1 = {x: 0, y: 0};
let t2 = {x: 0, y: 0};
let zoomLevel = 100;
let zoom = 1;

let overlay = false;
let shift = false;
let cmd = false;

let imgIcon;
let isFileDragging = false;
let eraserSize = 64;


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
  setupBackground();
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

function setupBackground() {
  var numCols = Math.ceil(width/BG_RECT_SIZE);
  var numRows = Math.ceil(height/BG_RECT_SIZE);
  numCols += (numCols % 2);
  numRows += (numRows % 2);
  pgBg = createGraphics(numCols * BG_RECT_SIZE, numRows * BG_RECT_SIZE);
  pgBg.background(255);
  pgBg.noStroke();
  for (var j=0; j<numRows; j++) {
    for (var i=0; i<numCols; i++) {
      var x = i * BG_RECT_SIZE;
      var y = j * BG_RECT_SIZE;
      filled = (j+i)%2==0;
      pgBg.fill(filled ? 155 : 225, 100);
      pgBg.rect(x, y, BG_RECT_SIZE, BG_RECT_SIZE)
    }
  }
}

function drawBackground() {
  let w = pgBg.width;
  let h = pgBg.height;
  let y1 = Math.floor(-trans.y / (h * zoom));
  let x1 = Math.floor(-trans.x / (w * zoom));
  var x2 = (width-trans.x)/zoom;
  var y2 = (height-trans.y)/zoom;
  let y = y1 * pgBg.height;
  while (y < y2) {
    let x = x1 * pgBg.width;
    while (x < x2) {
      image(pgBg, x, y);
      x += w;
    }
    y += h;
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

  // fps
  push();
  fill(0);
  textSize(20);
  text(Math.floor(frameRate()), width-30, 20);
  pop();

  if (keyIsDown(91)) {
    drawEraserTool(mouse);
  }
}

function drawEraserTool(mouse) {
  push();
  noFill();
  colorMode(HSB, 360, 100, 100);
  stroke(frameCount % 360, 100, 100);
  strokeWeight(2);
  ellipse(mouseRaw.x, mouseRaw.y, eraserSize*zoom, eraserSize*zoom);
  pop();
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
  updateCursor();
}

function updateCursor() {
  setCursor("auto");
  if (keyIsDown(91)) {
    setCursor("eraser");
  } else if (keyIsDown(SHIFT)) {
    setCursor("all-scroll");
  }
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
    canvas.updateMask(mouse.x, mouse.y);
  }
  else {
    for (var p=0; p<patches.length; p++) {
      if (patches[p].mouseDragged(mouse)) {
        return;
      }
    }
    if (selector) {
      selector.mouseDragged(mouse); 
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

  canvas.mouseReleased(mouse);
}

function keyPressed() {
  updateCursor();
  if (overlay) {
    if (key == 'Escape') {
      hideCreationTool();
      hideHelp();
    }
    return;
  }
}

function keyReleased() {
  updateCursor();
  if (overlay) {
    return;
  }
}

function mouseWheel(event) {
  if (event.deltaY > 0) {
    setZoomLevel(zoomLevel-1);
    setCursor("zoom-in");
  } 
  else if (event.deltaY < 0) {
    setZoomLevel(zoomLevel+1);
    setCursor("zoom-out")
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
