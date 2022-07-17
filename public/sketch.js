// 


var canvas;

var patches = [];
var active = -1;

var zoomLevel;
var zoom;
var trans = {x: 0, y: 0};;

var selector = null;

// var prompting = false;
var shift = false;
var cmd = false;



// var initimg;
// function preload() {
//   initimg = loadImage("2.jpg");
// }

function setup() {
  hideCreationTool();
  createCanvas(windowWidth, windowHeight);
  canvas = new Canvas();

  selector = null;
  //selector = new Selector(true, false, null);
  //selector.set(0, 0, 512, 512);
  // var p = new Patch(false, true, initimg);
  // p.set(0, 0, 512, 512);
  // patches.push(p);

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

}

function mousePressed() {
  var mx = (mouseX-trans.x)/zoom;
  var my = (mouseY-trans.y)/zoom;



  if (!selector) {
    selector = new Selection(true, true, false, null);
  }
  selector.mousePressed(mx, my);


}

function mouseDragged() {
  var mx = (mouseX-trans.x)/zoom;
  var my = (mouseY-trans.y)/zoom;

  if (shift) {
    if (selector) {
      selector.mouseDragged(mx, my); 
    }
  }
  else if (cmd) {
    canvas.drawMask(mx, my);
  }
  else {
    trans.x = trans.x + (mouseX - pmouseX)
    trans.y = trans.y + (mouseY - pmouseY);  
  }

}

function mouseReleased() {
  if (!selector) {
    return;
  }
  var mx = (mouseX-trans.x)/zoom;
  var my = (mouseY-trans.y)/zoom;
  selector.mouseReleased(mx, my);
  if (selector.w == 0 && selector.h == 0) {
    selector = null;
  }  
}

function keyPressed() {
  console.log(key);

  if (key == 'Shift') {
    shift = true;
    return;
  } 
  else if (key == 'Meta') {
    cmd = true;
    return;
  }

  if (key == 'Tab' && selector) {
    toggleCreationTool();
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

