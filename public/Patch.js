
class Patch extends MoveableObjectWithButtons {

  constructor(parent, moveable, resizeable, forceSquare) {
    super(parent, moveable, resizeable, forceSquare);
    this.img = null;
    this.prompt = null;
  }

  setupButtons(optStamp, optVary, optDelete) {
    const self = this;
    let y = 5;
    if (optStamp) {
      let bStamp = new Button(this, "Stamp", () => self.stamp());
      bStamp.set(5, 5, 120, 30);
      this.buttons.push(bStamp);
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

  stamp() {
    canvas.stamp(this);
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
    push();
    if (this.img) {
      fill(255);
      image(this.img, this.x, this.y, this.w, this.h);
    } else {
      fill(255, 100);
      rect(this.x, this.y, this.w, this.h);
    }
    if (this.prompt) {
      let fontSize = constrain(this.w * this.h / (125 * this.prompt.length), 16, 40);
      textSize(fontSize);
      textAlign(CENTER);      
      let statusWidth = textWidth(this.prompt);
      let numRows = Math.ceil(statusWidth/this.w) + 1;      
      fill(0, 155);      
      rect(this.x + this.w * 0.1, this.y + this.h * 0.25, this.w * 0.8, this.h * 0.5);
      fill(255);
      text(
        this.prompt + (this.status ? "\n" + this.status : ""),
        this.x + this.w * 0.12, 
        this.y + this.h * 0.5 - fontSize * (0.5 + 0.5 * numRows), 
        this.w * 0.76, 
        this.h * 0.5
      );
    }
    super.draw();
    pop();
  }
}
