// 


var canvas;
var patches = [];

var zoomLevel;
var zoom;
var trans = {x: 0, y: 0};;
var selector = null;

var prompting = false;
var selecting = false;
var alt = false;

var active = null;


var initimg;
function preload() {
  initimg = loadImage("2.jpg");
}

function setup() {
  hideCreationTool();
  createCanvas(windowWidth, windowHeight);
  canvas = new Canvas();

  var p = new Patch(false, true, initimg);
  p.set(0, 0, 512, 512);
  patches.push(p);

  setZoomLevel(100);
  setupSocket();
}

function drawBackground() {


  
  var margin = 20;

  var x1 = -trans.x/zoom;
  var y1 = -trans.y/zoom;

  //x1 -= abs(x1 % margin);
  //y1 -= abs(y1 % margin);

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



  // for (var j=0; j<30; j++) {
  //   filled = j % 2 == 0;
  //   for (var i=0; i<30; i++) {
  //     noStroke();
  //     fill(filled ? 100 : 200, 100);
  //     var x = 20 * i;
  //     var y = 20 * j;
  //     rect(x, y, 20, 20);
  //     filled = !filled;
  //   }

  // }

 // fill(255, 0, 0);
 // ellipse(trans.x, trans.y, 20);


  // var x1 = -trans.x/zoom;
  // var y1 = -trans.y/zoom;
  // fill(0, 255, 0);
  // ellipse(mx, my, 20);

  // var x2 = (width-trans.x)/zoom;
  // var y2 = (height-trans.y)/zoom;


  // fill(0, 255, 0);
  // ellipse(mx, my, 20);

}

function draw() {
  //background(200);
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

function mouseMoved() {
  if (selecting || prompting) {
    return;
  }
  var mx = (mouseX-trans.x)/zoom;
  var my = (mouseY-trans.y)/zoom;
  active = null;
  if (selector) {
    if (selector.inside(mx, my)) {
      active = -1;
    }
  }
  for (var p=0; p<patches.length; p++) {
    if (patches[p].inside(mx, my)) {
      active = p;
    }
  }
}

function mousePressed() {
  if (prompting) return;
  if (selecting) {
    if (active == null) return;
    if (active == -1) {
      selector.mousePressed(mouseX/zoom-trans.x, mouseY/zoom-trans.y);
    } else {
      patches[active].mousePressed(mouseX/zoom-trans.x, mouseY/zoom-trans.y);
    }
  } 
}

function mouseDragged() {
  if (prompting) return;
  var mx = (mouseX-trans.x)/zoom;
  var my = (mouseY-trans.y)/zoom;
  if (selecting) {    
    if (active == null) return;
    if (active == -1) {
      selector.mouseDragged(mx, my); 
    } else {
      patches[active].mouseDragged(mx, my); 
    }
  } 
  else if (alt) {
    

    if (active == null) {
      canvas.drawMask(mx, my);
    } else if (active == -1) {
      selector.drawMask(mx, my); 
    } else {
      patches[active].drawMask(mx, my); 
    }
  
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
  if (active == null) return;
  if (active == -1) {
    selector.mouseReleased(mx, my);
  } else {
    patches[active].mouseReleased(mx, my);
  }
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
  if (active == null || active ==-1) return;
  
  
  if (key == 'Enter') {
    console.log("PASTE")
    //canvas.paste(patches[active]);

    //patches.splice(active, 1);
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
  if (key == 'Shift') {
    selecting = false;
    return;
  }
  else if (key == 'Meta') {
    alt = false;
    return;
  } 
  else if (key == 'q') {
    selector = new Patch(false, true, null);
    selector.set((trans.x+width/2-256)/zoom, (trans.y+height/2-256)/zoom, 512, 512);
  }
  else if (key == 'w') {
    submitInpaint();
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

