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
      x > this.parent.x + this.x && 
      x < this.parent.x + this.x + this.w &&
      y > this.parent.y + this.y && 
      y < this.parent.y + this.y + this.h
    ); 
  }

  mouseMoved(mouse) {
    this.mouseover = this.inside(mouse.x, mouse.y);
  }

  mousePressed(mouse) {
    this.pressed = this.mouseover;
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
  }

  mousePressed(mouse) {
    if (this.mouseover) {
      this.pressed = true;
    }
    return this.pressed;
  }

  mouseReleased(mouse) {
    var released = false;
    if (this.pressed) {
      released = true;
      if (this.action) {
        this.action();
      }
    }
    this.pressed = false;
    return released;
  }

  draw() {
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
    textSize(this.h-6);
    textAlign(LEFT);
    text(this.name, this.parent.x + this.x + 5, this.parent.y + this.y + this.h-6);
    
    pop();
  }

}



class ObjectWithButtons extends HighlightableObject {

  constructor(parent) {
    super(parent);
    this.buttons = [];
  }

  mouseMoved(mouse) {
    super.mouseMoved(mouse);
    for (var b=0; b<this.buttons.length; b++) {
      this.buttons[b].mouseMoved(mouse);
    }
  }

  mousePressed(mouse) {
    var pressed = false;
    for (var b=0; b<this.buttons.length; b++) {
      if (this.buttons[b].mousePressed(mouse)) {
        pressed = true;
      }
    }
    if (!pressed) {
      pressed = super.mousePressed(mouse);
    }
    return pressed;
  }

  mouseReleased(mouse) {
    var released = false;
    for (var b=0; b<this.buttons.length; b++) {
      if (this.buttons[b].mouseReleased(mouse)) {
        released = true;
      }
    }
    if (!released) {
      released = super.mouseReleased(mouse);
    }
    return released;
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
  }

  draw() {
    if (this.mouseover) {
      for (var b=0; b<this.buttons.length; b++) {
        this.buttons[b].draw();
      }
      stroke(0, 250, 0);
    } else {
      stroke(100);
    }
    noFill();
    strokeWeight(5);
    rect(this.x, this.y, this.w, this.h);
  }

  mousePressed(mouse) {
    var pressed = super.mousePressed(mouse);
    if (pressed || !this.moveable) return pressed;

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
    return this.dragging;
  }

  mouseDragged(mouse) {
    if (!this.moveable) return false;

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
      if (this.forceSquare) {
        let horizontal = abs(this.s2.x-this.s1.x) > abs(this.s2.y-this.s1.y);
        if (horizontal) {
          let marginY = 0.5 * ((this.s2.x-this.s1.x) - (this.s2.y-this.s1.y));
          this.set(
            this.s1.x, 
            this.s1.y-marginY, 
            this.s2.x-this.s1.x, 
            this.s2.y-this.s1.y+2*marginY
          )
        } 
        else {
          let marginX = 0.5 * ((this.s2.y-this.s1.y) - (this.s2.x-this.s1.x));
          this.set(
            this.s1.x-marginX, 
            this.s1.y, 
            this.s2.x-this.s1.x+2*marginX, 
            this.s2.y-this.s1.y
          )
        }
      }
      else {
        this.set(
          this.s1.x,
          this.s1.y,
          this.s2.x - this.s1.x,
          this.s2.y - this.s1.y
        )
      }
    }
    return this.dragging;
  }

  mouseReleased(mouse) {
    var released = super.mouseReleased(mouse);
    this.dragging = false;
    if (released || !this.moveable) return released;
  }

}
