const SIZE_WARNING = "Warning: creating or inpainting this selection might fail because size is too large.";
    
    
class Selection extends MoveableObjectWithButtons {

  constructor(moveable, resizeable, forceSquare) {
    super(null, moveable, resizeable, forceSquare);
    this.window_size = {w:0, h:0};
    this.buttonsAlwaysVisible = true;
    this.buttonsVerticalAlign = "middle";
    
    this.bCreate = new Button(this, "Create", showCreationTool);
    // this.bInpaint = new Button(this, "Inpaint", submitInpaint);
    this.bCopy = new Button(this, "Copy", copySelection);
    this.bErase = new Button(this, "Erase", eraseSelection);
    
    this.bCreate.setVisible(false);
    // this.bInpaint.setVisible(false);
    this.bCopy.setVisible(false);
    this.bErase.setVisible(false);
    
    this.buttons.push(this.bCreate);
    // this.buttons.push(this.bInpaint);
    this.buttons.push(this.bCopy);
    this.buttons.push(this.bErase);
  }

  set(x, y, w, h) {
    super.set(x, y, w, h);
    this.positionButtons();
    this.window_size.w = Math.round(this.w/64)*64;
    this.window_size.h = Math.round(this.h/64)*64;
  }

  positionButtons() {
    let intersectsCanvas = canvas.intersects(this);
    this.bCopy.setEnabled(intersectsCanvas);
    this.bErase.setEnabled(intersectsCanvas);
    super.positionButtons();
  }
  
  draw() {
    let fontSize = min(this.h-4, 24);
    push();
    noStroke();
    fill(0, 125);
    rect(this.x, this.y, this.w, fontSize+4);
    fill(255);
    textSize(fontSize);
    textAlign(CENTER);
    text(
      int(this.w)+" x "+int(this.h)+" ➔ "+this.window_size.w+ " x "+this.window_size.h, 
      this.x+this.w/2, 
      this.y+fontSize
    );    
    if (this.window_size.w * this.window_size.h > CREATION_AREA_MAXIMUM) {
      let fontSize = constrain(this.w * this.h / (125 * SIZE_WARNING.length), 15, 30);
      this.drawBackgroundedText(SIZE_WARNING, fontSize, 'top', 0.25);
    } 
    super.draw();
    pop();
  }

  drawMask(canvas) {
    canvas.pgMask.rect(this.x - canvas.min.x, this.y - canvas.min.y, this.w, this.h);
  }

  mousePressed(mouse) {
    super.checkIfButtonsPressed(mouse);
    this.pressed = true;
    super.mousePressed(mouse, false);
  }

}



class Lasso extends MoveableObjectWithButtons {
  
  constructor() {
    super(null, true, true, false);
    this.points = [];
    this.min = {x: 1e8, y: 1e8};
    this.max = {x: -1e8, y: -1e8};
    this.selecting = false;
    
    this.buttonsAlwaysVisible = true;
    this.buttonsVerticalAlign = "middle";    
    this.bCopy = new Button(this, "Copy", copyLasso);
    this.bErase = new Button(this, "Erase", eraseLasso);
    this.buttons.push(this.bCopy);
    this.buttons.push(this.bErase);
  }

  positionButtons() {
    let intersectsCanvas = canvas.intersects(this);
    this.bCopy.setEnabled(intersectsCanvas);
    this.bErase.setEnabled(intersectsCanvas);
    super.positionButtons();
  }

  set(x, y, w, h) {
    super.set(x, y, w, h);
    this.positionButtons();
  }

  draw() {
    push();
    noFill();
    if (this.selecting) {
      stroke(0, 255, 0);
    } else {
      stroke(255, 0, 0);
    }
    strokeWeight(5);
    beginShape();
    for (var p=0; p<this.points.length; p++) {
      vertex(this.points[p].x, this.points[p].y);
    }
    if (this.selecting) {
      endShape();
    } else {
      endShape(CLOSE);
    }
    super.draw();
    pop();
  }

  drawMask(canvas) {
    canvas.pgMask.beginShape();
    for (var p=0; p<this.points.length; p++) {
      canvas.pgMask.vertex(this.points[p].x-canvas.min.x, this.points[p].y-canvas.min.y);
    }
    canvas.pgMask.endShape(CLOSE);
  }

  getMaskImage() {
    let pgMask = createGraphics(this.w, this.h);
    pgMask.beginShape();
    for (var p=0; p<this.points.length; p++) {
      pgMask.vertex(this.points[p].x-this.x, this.points[p].y-this.y);
    }
    pgMask.endShape(CLOSE);
    return pgMask.get();
  }

  mousePressed(mouse) {
    super.mousePressed(mouse);
    this.pressed = true;
    super.checkIfButtonsPressed(mouse);
    if (!this.mouseover) {
      this.selecting = true;
      this.points = [];
      this.min = {x: 1e8, y: 1e8};
      this.max = {x: -1e8, y: -1e8};
    }
  }

  mouseDragged(mouse) {
    if (this.selecting) {
      this.points.push({x: mouse.x, y: mouse.y});
      this.min.x = min(this.min.x, mouse.x);
      this.min.y = min(this.min.y, mouse.y);
      this.max.x = max(this.max.x, mouse.x);
      this.max.y = max(this.max.y, mouse.y);
      return true;
    } else {
      return false;
    }
  }

  mouseReleased(mouse) {
    super.mouseReleased(mouse);
    if (this.selecting) {
      this.set(
        this.min.x, 
        this.min.y, 
        this.max.x-this.min.x, 
        this.max.y-this.min.y
      );
      this.selecting = false;
    }
  }

}