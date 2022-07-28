class Selection extends MoveableObjectWithButtons {

  constructor(moveable, resizeable, forceSquare) {
    super(null, moveable, resizeable, forceSquare);
    this.window_size = {w:0, h:0};
    this.buttonsAlwaysVisible = true;
    let bCreate = new Button(this, "Create", this.create);
    let bInpaint = new Button(this, "Inpaint", this.inpaint);
    let bCopy = new Button(this, "Copy", this.copy);
    let bErase = new Button(this, "Erase", this.erase);
    bCreate.setVisible(false);
    bInpaint.setVisible(false);
    bCopy.setVisible(false);
    bErase.setVisible(false);
    this.buttons.push(bCreate);
    this.buttons.push(bInpaint);
    if (canvas.pg) {
      this.buttons.push(bCopy);
      this.buttons.push(bErase);
    }
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