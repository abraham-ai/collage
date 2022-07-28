class Selection extends MoveableObjectWithButtons {

  constructor(moveable, resizeable, forceSquare) {
    super(null, moveable, resizeable, forceSquare);
    this.window_size = {w:0, h:0};
    this.buttonsAlwaysVisible = true;
    
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
    console.log("self delete")
  }

  set(x, y, w, h) {
    super.set(x, y, w, h);
    this.positionButtons();
    this.window_size.w = Math.round(this.w/64)*64;
    this.window_size.h = Math.round(this.h/64)*64;
  }

  positionButtons() {
    super.positionButtons();
    if (!canvas.pg) {
      this.bCopy.setVisible(false);
      this.bErase.setVisible(false);
    }
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
    super.draw();
    pop();
  }

  mousePressed(mouse) {
    super.checkIfButtonsPressed(mouse);
    this.pressed = true;
    super.mousePressed(mouse, false);
  }

}