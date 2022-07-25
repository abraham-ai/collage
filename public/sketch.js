// 


var canvas;

var patches = [];
var active = -1;

var zoomLevel;
var zoom;
var trans = {x: 0, y: 0};
var mouse = {x: 0, y: 0};

var selector = null;

var prompting = false;
var shift = false;
var cmd = false;



function setup() {
  let cp5 = createCanvas(windowWidth, windowHeight);
  cp5.drop(fileDropped);

  canvas = new Canvas();
  selector = null;
  
  setZoomLevel(100);
  setupSocket();
}

function drawBackground() {
  var margin = 20;
  var x1 = -trans.x/zoom;
  var y1 = -trans.y/zoom;
  var x2 = (width-trans.x)/zoom;
  var y2 = (height-trans.y)/zoom;
  x2 += margin;
  y2 += margin;
  var filledy = false;
  for (var y=y1; y<y2; y+=margin) {
    //filled = j % 2 == 0;
    filledy = !filledy;
    filled = filledy;
    for (var x=x1; x<x2; x+=margin) {
      noStroke();
      fill(filled ? 155 : 225, 100);
      rect(x, y, margin, margin);
      filled = !filled;
    }
  }
}

function draw() {

  //console.log("pr "+prompting+ " shift "+shift + " cmd "+cmd);

  background(255);
 
  push();

  translate(trans.x, trans.y);
  scale(zoom);
 
  drawBackground();
  canvas.draw();
  
  patches.forEach((patch, i) => {
    patch.draw(active == i);
  });
 
  if (selector) {
    selector.draw(active == -1);
  }

  pop();
}

function setZoomLevel(z) {
  zoomLevel = constrain(z, 0, 100);
  zoom = 0.01 * pow(100, zoomLevel/100.0);
}

function updateMouse() {
  mouse.x = (mouseX-trans.x)/zoom;
  mouse.y = (mouseY-trans.y)/zoom;
}

function mouseMoved() {
  updateMouse();
  for (var p=0; p<patches.length; p++) {
    patches[p].mouseMoved(mouse);
  }

  if (selector) {
    selector.mouseMoved(mouse);
  }
}

function mousePressed() {
  updateMouse();

  let pressed = false;
  for (var p=0; p<patches.length; p++) {
    if (patches[p].mousePressed(mouse)) {
      pressed = true;
      break;
    }
  }

  if (pressed) return;

  if (!selector) {
    selector = new Selection(true, true, false, null);
  }
  selector.mousePressed(mouse);
}

function mouseDragged() {
  updateMouse();

  if (shift) {

    let dragging = false;
    for (var p=0; p<patches.length; p++) {
      if (patches[p].mouseDragged(mouse)) {
        dragging = true;
        break;
      }
    }

    if (selector && !dragging) {
      selector.mouseDragged(mouse); 
    }
  }
  else if (cmd) {
    canvas.drawMask(mouse.x, mouse.y);
  }
  else {
    trans.x = trans.x + (mouseX - pmouseX)
    trans.y = trans.y + (mouseY - pmouseY);  
  }
}

function mouseReleased() {
  updateMouse();

  let released = false;
  for (var p=0; p<patches.length; p++) {
    if (patches[p].mouseReleased(mouse)) {
      released = true;
    }
  }

  if (!selector || released) {
    return;
  }

  selector.mouseReleased(mouse);
  if (selector.w == 0 && selector.h == 0) {
    selector = null;
  }  
}

function keyPressed() {
  console.log(key);
  if (prompting) {
    return;
  }

  if (key == 'Shift') {
    shift = true;
    return;
  } 
  else if (key == 'Meta') {
    cmd = true;
    return;
  }

  // if (key == 'Tab' && selector) {
  //   // toggleCreationTool();
  //   return;
  // }

  
  if (active == null || active ==-1) return;
  
  if (key == 'Enter') {
  }
  else if (key == 'Backspace') {
    if (active == -1) {
      selector = null;
    } else {
      patches.splice(active, 1);
    }
  }
}

function keyReleased() {
  if (prompting) {
    return;
  }

  if (key == 'Shift') {
    shift = false;
    return;
  }
  else if (key == 'Meta') {
    cmd = false;
    return;
  } 
  else if (key == 'q') {
    // selector = new Patch(false, true, null);
    // selector.set((trans.x+width/2-256)/zoom, (trans.y+height/2-256)/zoom, 512, 512);
  }
  else if (key == 't') {

  }
  else if (key == 'w') {
    //submitInpaint();
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

// function toggleCreationTool() {
//   if (prompting) {
//     hideCreationTool();
//   } else {
//     showCreationTool();
//   }
// }


function mySubmitFunction(e) {
  e.preventDefault();
  hideCreationTool();
  submitPrompt();
  return false;
}

