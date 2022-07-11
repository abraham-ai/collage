class Patch {

    constructor(resizeable, forceSquare, img) {
      this.resizeable = resizeable;
      this.forceSquare = forceSquare;
      this.img = img;
      this.s1 = {x:0, y:0};
      this.s2 = {x:0, y:0};
      this.anchor = {x:0, y:0};
      this.dragging = false;
      this.set(0, 0, 0, 0);
    }
        
    set(x, y, w, h) {
      this.x = x;
      this.y = y;
      this.w = w;
      this.h = h;
    }
    
    setCenter(cx, cy) {
      this.set(cx-this.w/2, cy-this.h/2, this.w, this.h);
      this.s1.x = this.x;
      this.s1.y = this.y;
      this.s2.x = this.x+this.w;
      this.s2.y = this.y+this.h;
    }
    
    draw(active) {
      push();
      if (this.img) {
        fill(255);
        image(this.img, this.x, this.y, this.w, this.h);
      } else {
        fill(255, 100);
        rect(this.x, this.y, this.w, this.h);
      }
      if (active) {
        stroke(0, 0, 255);
        noFill();
        strokeWeight(3);
        rect(this.x, this.y, this.w, this.h);
      }
      pop();
    }
    
    inside(x, y) {
      return (
        x>this.x && 
        x<this.x+this.w &&
        y>this.y && 
        y<this.y+this.h
      ); 
    }
  
    mousePressed(mx, my) {
      this.anchor.x = this.x;
      this.anchor.y = this.y;
      this.s1.x = mx;
      this.s1.y = my;
      if (this.inside(mx, my)) {
        this.dragging = true;
      } 
      else if (this.resizeable) {
        console.log("THIS IS RESIZING!!! 2222")  
        this.s2.x = this.s1.x;
        this.s2.y = this.s1.y;
      }
      return this.dragging;
    }
  
    mouseDragged(mx, my) {
      this.s2.x = mx;
      this.s2.y = my;
      if (this.dragging) {
        this.x = this.anchor.x + (this.s2.x - this.s1.x);
        this.y = this.anchor.y + (this.s2.y - this.s1.y);
      } 
      else if (this.resizeable) {  
        console.log("THIS IS RESIZING!!!")  
        if (this.forceSquare) {
          if (abs(this.s2.x-this.s1.x) > abs(this.s2.y-this.s1.y)) {
            let marginY = 0.5 * ((this.s2.x-this.s1.x) - (this.s2.y-this.s1.y));
            this.set(this.s1.x, this.s1.y-marginY, this.s2.x-this.s1.x, this.s2.y-this.s1.y+2*marginY);
          } else {
            let marginX = 0.5 * ((this.s2.y-this.s1.y) - (this.s2.x-this.s1.x));
            this.set(
              this.s1.x-marginX, 
              this.s1.y, 
              this.s2.x-this.s1.x+2*marginX, 
              this.s2.y-this.s1.y
            );
          }
        }
        else {
          this.x = this.s1.x;
          this.y = this.s1.y;
          this.w = this.s2.x - this.s1.x;
          this.h = this.s2.y - this.s1.y;
        }
      }
      return this.dragging;
    }
  
    mouseReleased(mx, my) {
      this.dragging = false;
    }
  }
    
    