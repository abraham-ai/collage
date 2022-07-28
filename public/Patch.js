
class Patch extends MoveableObjectWithButtons {

  constructor(parent, moveable, resizeable, forceSquare) {
    super(parent, moveable, resizeable, forceSquare);
    this.img = null;
    this.prompt = null;
  }

  setupButtons(optPaste, optVary, optDelete) {
    const self = this;
    let y = 5;
    if (optPaste) {
      let bPaste = new Button(this, "Paste", () => self.paste());
      bPaste.set(5, 5, 120, 30);
      this.buttons.push(bPaste);
      y += 35;
    }
    if (optVary) {
      let bVariations = new Button(this, "Variations", () => self.variations());
      bVariations.set(5, y, 120, 30);
      this.buttons.push(bVariations);
      y += 35;
    }
    if (optDelete) {
      let bDelete = new Button(this, "Delete", () => self.delete());
      bDelete.set(5, y, 120, 30);    
      this.buttons.push(bDelete);
      y += 35;
    }
  }

  // set(x, y, w, h) {
  //   super.set(x, y, w, h);
  //   this.positionButtons();
  // }

  paste() {
    canvas.paste(this);
  }

  variations() {
    if (this.prompt) {
      document.getElementById("prompt").value = this.prompt;
    } 
    selector = new Selection(true, true, false, null);
    selector.set(this.x+0.15*this.w, this.y+0.15*this.h, this.w, this.h);
    showCreationTool();
  }

  delete() {
    var idx = patches.indexOf(this);
    patches.splice(idx, 1);
  }

  draw() {
    // console.log("drawing do i have img?", this.img)
    push();
    if (this.img) {
      fill(255);
      image(this.img, this.x, this.y, this.w, this.h);
    } else {
      fill(255, 100);
      rect(this.x, this.y, this.w, this.h);
    }
    // if (this.status) {
    //   fill(0);
    //   textSize(24);
    //   textAlign(CENTER);
    //   text(this.status, this.x+this.w/2, this.y+this.h/2)
    // }
    //if (this.mouseover && this.prompt) {
    
    if (this.prompt) {
//      console.log(this.w * this.h / (125 * this.prompt.length));
      let fontSize = constrain(this.w * this.h / (125 * this.prompt.length), 16, 40);
      
      textSize(fontSize);
      textAlign(CENTER);
      
      let statusWidth = textWidth(this.prompt);
      let numRows = Math.ceil(statusWidth/this.w) + 1;
      
      fill(0, 155);
      
      rect(this.x+2, this.y+this.h/4, this.w-4, this.h/2);
      fill(255);
      text(
        this.prompt+"\n"+this.status, 
        this.x, 
        this.y + this.h/2 - fontSize * (0.5 + 0.5 * numRows), 
        this.w, 
        this.h/2
      );
    }
      //}
    super.draw();
    pop();
  }
}




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
    this.buttons.push(bCopy);
    this.buttons.push(bErase);
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