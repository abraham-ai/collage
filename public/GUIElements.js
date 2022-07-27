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

  inside(x, y) {
    return (
      x >= this.parent.x + this.x && 
      x <  this.parent.x + this.x + this.w &&
      y >= this.parent.y + this.y && 
      y <  this.parent.y + this.y + this.h
    ); 
  }

  mouseMoved(mouse) {
    this.mouseover = this.inside(mouse.x, mouse.y);
  }

  mousePressed(mouse) {
    this.pressed = this.mouseover;
    console.log("I AM PRESSED", this.pressed);
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
  }

  setVisible(visible) {
    this.visible = visible;
  }

  mousePressed(mouse) {
    if (!this.visible) return;
    super.mousePressed(mouse);
  }

  mouseDragged(mouse) {
    if (!this.visible) return;
    super.mouseDragged(mouse);
  }

  mouseReleased(mouse) {
    if (!this.visible) return;
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
    for (var b=0; b<this.buttons.length; b++) {
      this.buttons[b].mouseMoved(mouse);
    }
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
    this.anchor = {x:0, y:0};
    this.dragging = false;

    this.borderColor = color(100);
    this.borderColorHighlighted = color(0, 250, 0);
    this.borderWidth = 5;
    this.buttonsAlwaysVisible = false;
  }

  draw() {
    if (this.mouseover || this.buttonsAlwaysVisible) {
      for (var b=0; b<this.buttons.length; b++) {
        this.buttons[b].draw();
      }
    }
    if (this.mouseover) {
      stroke(this.borderColorHighlighted);
    } else {
      stroke(this.borderColor);
    }
    noFill();
    strokeWeight(this.borderWidth);
    rect(this.x, this.y, this.w, this.h);
  }

  mousePressed(mouse, callSuper=true) {   
    console.log("PRESS")
    if (callSuper) {
      super.mousePressed(mouse);
    }
    if (this.pressed && this.moveable && !this.buttonPressed){
      this.anchor.x = this.x;
      this.anchor.y = this.y;
      this.s1.x = mouse.x;
      this.s1.y = mouse.y;
      if (this.mouseover) {
        this.dragging = true;
      } 
      else if (this.resizeable) {
        this.s2.x = this.s1.x;
        this.s2.y = this.s1.y;
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
    
    if (this.dragging) {
      this.set(
        this.anchor.x + (this.s2.x - this.s1.x),
        this.anchor.y + (this.s2.y - this.s1.y),
        this.w,
        this.h
      )
    } 
    else if (this.resizeable) {  
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
    }
  }

  mouseReleased(mouse) {
    console.log("RELEASe")
    super.mouseReleased(mouse);
    this.dragging = false;
  }

}
