function setCursorCSS(cursorType) {
  if (cursorType == "eraser") {
    //document.body.style.cursor = "none";
  } else {
    document.body.style.cursor = cursorType;
  }
}


class HighlightableObject {
  constructor(parent) {
    this.parent = parent ? parent : {x: 0, y: 0, w: 0, h: 0};
    this.mouseover = false;
    this.pressed = false;
    this.x = 0;
    this.y = 0;
    this.w = 0;
    this.h = 0;
  }
  
  set(x, y, w, h) {
    this.x = x;
    this.y = y;
    this.w = w;
    this.h = h;
  }

  getX1() {
    return this.parent.x + this.x;
  }

  getY1() {
    return this.parent.y + this.y;
  }

  getX2() {
    return this.parent.x + this.x + this.w;
  }

  getY2() {
    return this.parent.y + this.y + this.h;
  }

  inside(x, y) {
    return (
      x >= this.getX1() && 
      x <  this.getX2() &&
      y >= this.getY1() && 
      y <  this.getY2()
    ); 
  }

  mouseMoved(mouse) {
    this.mouseover = this.inside(mouse.x, mouse.y);
    return this.mouseover;
  }

  mousePressed(mouse) {
    this.pressed = this.mouseover;
    return this.pressed;
  }

  mouseReleased(mouse) {
    this.pressed = false;
  }

}


class Button extends HighlightableObject {

  constructor(parent, name, action) {
    super(parent);
    this.name = name;
    this.action = action;
    this.pressed = false;
    this.visible = true;
    this.enabled = true;
  }

  setEnabled(enabled) {
    this.enabled = enabled;
  }

  setVisible(visible) {
    this.visible = visible;
  }

  mouseMoved(mouse) {
    super.mouseMoved(mouse);
    if (this.visible && this.enabled && this.mouseover) {
      setCursorCSS("pointer");
      return true;
    }
    return false;
  }

  mousePressed(mouse) {
    if (!this.visible || !this.enabled) return;
    super.mousePressed(mouse);
  }

  mouseDragged(mouse) {
    if (!this.visible || !this.enabled) return;
    super.mouseDragged(mouse);
  }

  mouseReleased(mouse) {
    if (!this.visible || !this.enabled) return;
    if (this.pressed && this.action) {
      this.action();
    }
    this.pressed = false;
  }

  draw() {
    if (!this.visible) return;

    push();
    
    if (this.pressed) {
      fill(0, 200, 0, 180);
      stroke(0, 250, 0);
    } 
    else if (this.mouseover){
      fill(0, 100, 0, 180);
      stroke(0, 150, 0);
    } 
    else {
      fill(100, 180);
      stroke(120);
    }
    
    strokeWeight(3);
    rect(this.parent.x + this.x, this.parent.y + this.y, this.w, this.h);
    
    if (this.pressed) {
      fill(0, 250, 0);
    } else if (this.mouseover){
      fill(0, 150, 0);
    } else {
      fill(100);
    }
    fill(255);

    noStroke();
    textSize(this.h * 0.8);
    textAlign(CENTER);
    text(this.name, this.parent.x + this.x + this.w/2, this.parent.y + this.y + 0.8 * this.h);
    
    pop();
  }

}


class ObjectWithButtons extends HighlightableObject {

  constructor(parent) {
    super(parent);
    this.buttons = [];
  }

  checkIfButtonsPressed(mouse) {
    this.buttonPressed = false;
    for (var b=0; b<this.buttons.length; b++) {
      if (this.buttons[b].mousePressed(mouse)) {
        this.buttonPressed = true;
      }
    }
  }

  mouseMoved(mouse) {
    super.mouseMoved(mouse);
    let buttonHighlighted = false;
    for (var b=0; b<this.buttons.length; b++) {
      if (this.buttons[b].mouseMoved(mouse)) {
        buttonHighlighted = true;
      }      
    }
    return buttonHighlighted;
  }

  mousePressed(mouse) {
    super.mousePressed(mouse);
    this.checkIfButtonsPressed(mouse);
    return this.pressed;
  }

  mouseReleased(mouse) {
    this.buttonPressed = false;
    super.mouseReleased(mouse);
    for (var b=0; b<this.buttons.length; b++) {
      this.buttons[b].mouseReleased(mouse);
    }
  }

}


class MoveableObjectWithButtons extends ObjectWithButtons {
    
  constructor(parent, moveable, resizeable, forceSquare) {
    super(parent);
    
    this.moveable = moveable;
    this.resizeable = resizeable;
    this.forceSquare = forceSquare;

    this.s1 = {x:0, y:0};
    this.s2 = {x:0, y:0};
    this.anchor = {x:0, y:0, w:0, h:0};
    this.dragging = false;
    this.resizing = false;

    this.west = false;
    this.east = false;
    this.north = false;
    this.south = false;

    this.borderColor = color(100);
    this.borderColorHighlighted = color(0, 250, 0);
    this.borderWidth = 5;
    this.buttonsAlwaysVisible = false;
    this.buttonsVerticalAlign = 'bottom';
  }

  getMouseOverResizing() {
    return (this.north || this.south || this.west || this.east);
  }

  positionButtons() {
    let buttons = [];
    for (var b=0; b<this.buttons.length; b++) {
      this.buttons[b].setVisible(false);
      if (this.buttons[b].enabled) {
        buttons.push(this.buttons[b]);
      }
    }
    let availArea = 0.66 * (this.w * (this.h-30));
    let bArea = constrain(availArea / buttons.length, 300, 6000);
    let bW = max(this.parent.w, Math.sqrt(bArea * 4));
    let bH = bW / 4;
    if (availArea > (1.1 * bW * 1.2 * bH) * buttons.length ||
        this.buttonsAlwaysVisible) {
      let cols = max(1, min(buttons.length, Math.floor((this.w-10) / (1.1 * bW))));
      let rows = Math.floor(buttons.length/cols);
      let lx = 5 + (this.w - (bW * cols * 1.1)) / 2;
      let ly = 40;
      if (this.buttonsVerticalAlign == 'middle') {
        ly += ((this.h - 40) - (rows * bH * 1.2)) / 2;
      }
      else if (this.buttonsVerticalAlign == 'bottom') {
        ly += ((this.h - 80) - (rows * bH * 1.2));
      }
      for (var b=0; b<buttons.length; b++) {
        let x = lx + (b%cols) * bW * 1.1;
        let y = ly + Math.floor(b/cols) * bH * 1.2;
        buttons[b].setVisible(true);
        buttons[b].set(x, y, bW, bH);
      }
    } else {
      for (var b=0; b<buttons.length; b++) {
        this.buttons[b].setVisible(false);
      }
    }
  }

  setButtonsVisible(visible) {
    for (var b=0; b<this.buttons.length; b++) {
      this.buttons[b].setVisible(visible);
    }
  }

  drawButtons() {
    if (this.mouseover || this.buttonsAlwaysVisible) {
      for (var b=0; b<this.buttons.length; b++) {
        this.buttons[b].draw();
      }
    }
  }

  draw() {   
    this.drawButtons(); 
    if (this.mouseover) {
      stroke(this.borderColorHighlighted);
    } else {
      stroke(this.borderColor);
    }
    noFill();
    strokeWeight(this.borderWidth);
    rect(this.x, this.y, this.w, this.h);
  }

  drawBackgroundedText(textStr, fontSize, vertical_position, yHeight) {
    push();
    textSize(fontSize);
    textAlign(CENTER);      
    let statusWidth = textWidth(textStr);
    let numRows = Math.ceil(statusWidth/this.w);      
    let y = 0;
    if (vertical_position == 'top') {
      y = this.y + this.h * 0.1;
    } else if (vertical_position == 'middle') {
      y = this.y + this.h * (1.0 - yHeight) * 0.5
    } else if (vertical_position == 'bottom') {
      y = this.y + this.h * (1.0 - yHeight);
    }
    fill(0, 155);      
    rect(
      this.x + this.w * 0.075, 
      y, 
      this.w * 0.85, 
      this.h * yHeight
    );
    fill(255);
    text(
      textStr,
      this.x + this.w * 0.09, 
      y + this.h * yHeight * 0.5 - fontSize * (0.5 + 0.5 * numRows),
      this.w * 0.82, 
      this.h * yHeight
    );
    pop();
  }

  handleResize() {
    let dy = this.s2.y - this.s1.y;
    let dx = this.s2.x - this.s1.x;
    if (this.dragging) {
      if (this.resizing) {   
        let aspect = this.w / this.h;          
        let aspectLocked =
          ((this.north || this.south) && !this.west && !this.east) ||
          ((this.west || this.east) && !this.north && !this.south);
        if (aspectLocked) {
          let W = this.anchor.w;
          let H = this.anchor.h;
          let mx = 0;
          let my = 0;
          if (this.north) {
            H = this.anchor.h - dy;
            W = H * aspect;
            mx = 0.5 * (W - this.anchor.w);
            my = -dy;
          } 
          else if (this.south) {
            H = this.anchor.h + dy;
            W = H * aspect; 
            mx = 0.5 * (W - this.anchor.w);
            my = 0;
          }
          else if (this.east) {          
            W = this.anchor.w + dx;
            H = W / aspect;
            mx = 0;
            my = 0.5 * (H - this.anchor.h);
          } 
          else if (this.west) {          
            W = this.anchor.w - dx;
            H = W / aspect;
            mx = -dx;
            my = 0.5 * (H - this.anchor.h);
          } 
          this.set(this.anchor.x - mx, this.anchor.y - my, W, H);
        }
        else {
          this.set(
            this.anchor.x + (this.west ? dx : 0), 
            this.anchor.y + (this.north ? dy : 0), 
            this.anchor.w + (this.west ? -dx : dx), 
            this.anchor.h + (this.north ? -dy : dy)
          );
        }
        this.positionButtons();
      } else {
        setCursorCSS("grabbing");
        this.set(
          this.anchor.x + dx,
          this.anchor.y + dy,
          this.w,
          this.h
        )
      }
      return true;
    } 
    else if (this.resizeable) {        
      if (this.s1.y <= this.s2.y) {
        if (this.s1.x <= this.s2.x) {
          setCursorCSS("se-resize");
        } else {
          setCursorCSS("sw-resize");
        }
      } else {
        if (this.s1.x <= this.s2.x) {
          setCursorCSS("ne-resize");
        } else {
          setCursorCSS("nw-resize");
        }
      }
      let marginX = 0;
      let marginY = 0;
      if (this.forceSquare) {
        let horizontal = abs(this.s2.x-this.s1.x) > abs(this.s2.y-this.s1.y);
        if (horizontal) {
          marginY = 0.5 * ((this.s2.x-this.s1.x) - (this.s2.y-this.s1.y));
        } else {
          marginX = 0.5 * ((this.s2.y-this.s1.y) - (this.s2.x-this.s1.x));
        }
      }
      this.set(
        ((this.s1.x <= this.s2.x) ? this.s1.x : this.s2.x) - marginX,
        ((this.s1.y <= this.s2.y) ? this.s1.y : this.s2.y) - marginY,
        ((this.s1.x <= this.s2.x) ? this.s2.x - this.s1.x : this.s1.x - this.s2.x) + 2*marginX,
        ((this.s1.y <= this.s2.y) ? this.s2.y - this.s1.y : this.s1.y - this.s2.y) + 2*marginY
      )
      return true;
    }
    return false;
  }

  setCursor() {
    if (!this.mouseover || this.resizing) {
      return;
    }
    let margin = 50.0 / zoom;
    this.west  = mouse.x < this.getX1() + margin && mouse.x > this.getX1();
    this.east  = mouse.x > this.getX2() - margin && mouse.x < this.getX2();
    this.north = mouse.y < this.getY1() + margin && mouse.y > this.getY1();
    this.south = mouse.y > this.getY2() - margin && mouse.y < this.getY2();
    this.updateCursorCSS();
  }

  updateCursorCSS() {
    if (this.getMouseOverResizing()) {
      let cursorStr = "";
      if (this.north) cursorStr += "n"
      if (this.south) cursorStr += "s"
      if (this.west) cursorStr += "w"
      if (this.east) cursorStr += "e"
      setCursorCSS(cursorStr+"-resize");  
    } else {      
      setCursorCSS("grab")
    }
  }

  mouseMoved(mouse) {
    let buttonHighlighted = super.mouseMoved(mouse);
    if (!buttonHighlighted && this.mouseover) {
      this.setCursor();
    }
  }

  mousePressed(mouse, callSuper=true) {   
    if (callSuper) {
      super.mousePressed(mouse);
    }
    if (this.pressed && this.moveable && !this.buttonPressed){
      this.anchor.x = this.x;
      this.anchor.y = this.y;
      this.anchor.w = this.w;
      this.anchor.h = this.h;
      this.s1.x = mouse.x;
      this.s1.y = mouse.y;
      if (this.mouseover) {
        this.dragging = true;
      } 
      else if (this.resizeable) {
        this.s2.x = this.s1.x;
        this.s2.y = this.s1.y;
      }
      this.resizing = this.getMouseOverResizing();
      if (!this.resizing) {
        this.updateCursorCSS();
      }
    }
    return this.pressed;
  }

  mouseDragged(mouse) {
    if (!this.moveable) return false;
    if (!this.pressed) return false;    
    if (this.buttonPressed) return false;
    this.s2.x = mouse.x;
    this.s2.y = mouse.y;
    return this.handleResize();
  }

  mouseReleased(mouse) {
    super.mouseReleased(mouse);
    if (this.dragging){
      this.positionButtons();
      this.dragging = false;
    }
    this.resizing = false;
  }

}