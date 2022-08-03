const SIZE_WARNING = "Warning: creating or inpainting this selection might fail because size is too large.";
    
    
class Selection extends MoveableObjectWithButtons {

  constructor(moveable, resizeable, forceSquare) {
    super(null, moveable, resizeable, forceSquare);
    this.window_size = {w:0, h:0};
    this.buttonsAlwaysVisible = true;
    this.buttonsVerticalAlign = "middle";
    
    this.bCreate = new Button(this, "Create", this.create);
    this.bInpaint = new Button(this, "Inpaint", this.inpaint);
    this.bCopy = new Button(this, "Copy", this.copy);
    this.bErase = new Button(this, "Erase", this.erase);
    
    this.bCreate.setVisible(false);
    this.bInpaint.setVisible(false);
    this.bCopy.setVisible(false);
    this.bErase.setVisible(false);
    
    this.buttons.push(this.bCreate);
    this.buttons.push(this.bInpaint);
    this.buttons.push(this.bCopy);
    this.buttons.push(this.bErase);
  }

  create() {
    showCreationTool();
  }

  inpaint() {
    submitInpaint();
  }

  copy() {
    createCopy();
  }

  erase() {
    eraseCanvasSelection();
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

  mousePressed(mouse) {
    super.checkIfButtonsPressed(mouse);
    this.pressed = true;
    super.mousePressed(mouse, false);
  }

}