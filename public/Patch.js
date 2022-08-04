const STAMP_WARNING =  "Note: this stamp is not on the canvas yet. Click \"Stamp\" to paste it on, then delete the stamp when you don't need it anymore";


class Patch extends MoveableObjectWithButtons {

  constructor(parent, moveable, resizeable, forceSquare) {
    super(parent, moveable, resizeable, forceSquare);
    this.img = null;
    this.prompt = null;
    this.status = null;
    this.progress = 0;
    this.randomColorOffset = int(360 * Math.random());
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

  mouseMoved(mouse) {
    super.mouseMoved(mouse);
    if (this.mouseover) {
      if (this.status && (
        this.status.status == 'starting' || 
        this.status.status == 'pending' || 
        this.status.status == 'queued' ||
        this.status.status == 'running')) {
          setCursor("wait");
      }
    }
  }

  delete() {
    var idx = patches.indexOf(this);
    patches.splice(idx, 1);
  }

  drawProgressRect(amount, colorType) {
    let perimeter = (2*this.w + 2*this.h);
    let progress1 = this.w/perimeter;
    let progress2 = (this.w+this.h)/perimeter;
    let progress3 = (2*this.w+this.h)/perimeter;
    let amt1 = constrain(amount, 0, progress1) / progress1;
    let amt2 = constrain(amount - progress1, 0, progress2 - progress1) / (progress2 - progress1);
    let amt3 = constrain(amount - progress2, 0, progress3 - progress2) / (progress3 - progress2);
    let amt4 = constrain(amount - progress3, 0, 1 - progress3) / (1 - progress3);    
    push();
    strokeWeight(16);
    if (colorType == 0) {
      colorMode(RGB, 255, 255, 255);
      stroke(0, 255, 0);
    } else {
      colorMode(HSB, 360, 100, 100);
      stroke((frameCount + this.randomColorOffset) % 360, 100, 100);
    }
    noFill();
    if (amt1) {
      line(this.x, this.y, this.x + this.w * amt1, this.y);
    }
    if (amt2) {
      line(this.x + this.w, this.y, this.x + this.w, this.y + this.h * amt2);
    }
    if (amt3) {
      line(this.x + this.w, this.y + this.h, this.x + this.w * (1.0 - amt3), this.y + this.h);
    }
    if (amt4) {
      line(this.x, this.y + this.h, this.x, this.y + this.h * (1.0 - amt4));
    }
    pop();
  }

//starting
//{status: 'invalid token'}

  draw() {
    push();
    if (this.img) {
      fill(255);
      image(this.img, this.x, this.y, this.w, this.h);
    } else {
      fill(255, 100);
      rect(this.x, this.y, this.w, this.h);
    }
    if (this.status && this.status.status != 'complete') {
      let status_msg = this.prompt ? this.prompt : "Inpainting";
      if (this.status.status == 'pending') {
        status_msg += "\nPending";
      } else if (this.status.status == 'starting') {
        status_msg += "\nStarting";
      } else if (this.status.status == 'queued') {
        let queue_idx = this.status.queue_position;
        status_msg += "\nQueued #"+queue_idx;
      } else if (this.status.status == 'running') {
        if (this.status.progress == '__none__') {
          this.status.progress = 0;
        }        
        let progress = this.status.progress || 0;
        this.progress = lerp(this.progress, progress, 0.025);
        let progress_str = int(100*this.progress);
        status_msg += "\n"+progress_str+"% done";
      } else if (this.status.status == 'failed') {
        status_msg += "\nFailed :(";
      }
      let fontSize = constrain(this.w * this.h / (125 * status_msg.length), 16, 40);
      this.drawProgressRect(this.progress, 0);
      this.drawBackgroundedText(status_msg, fontSize, 'middle', 0.5);
    }
    if (this.moveable) {
      this.drawBackgroundedText(STAMP_WARNING, 16, 'top', 0.25);
      this.drawProgressRect(1, 1);
    }
    this.drawButtons();
    pop();
  }
}
