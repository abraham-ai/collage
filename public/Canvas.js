class Canvas {

  constructor() {
    this.min = {x:1e8, y:1e8};
    this.max = {x:-1e8, y:-1e8};
    this.pg = null;
    this.pgMask = null;
  }
      
  paste(patch) {
    let minx = min(this.min.x, patch.x);
    let miny = min(this.min.y, patch.y);
    let maxx = max(this.max.x, patch.x+patch.w);
    let maxy = max(this.max.y, patch.y+patch.h);

    let pgNew = createGraphics(maxx-minx, maxy-miny);
    let pgMaskNew = createGraphics(maxx-minx, maxy-miny);
    
    pgNew.push();
    pgNew.background(255, 0, 0);
    if (this.pg) {
      pgNew.image(this.pg, this.min.x-minx, this.min.y-miny);
    }
    pgNew.fill(255);
    pgNew.image(patch.img, patch.x-minx, patch.y-miny, patch.w, patch.h);
    pgNew.pop();

    pgMaskNew.push();
    pgMaskNew.background(0);
    if (this.pgMask) {
      pgMaskNew.image(this.pgMask, this.min.x-minx, this.min.y-miny);
    }
    pgMaskNew.fill(0);
    pgMaskNew.noStroke();
    pgMaskNew.rect(patch.x-minx, patch.y-miny, patch.w, patch.h);
    pgMaskNew.pop();

    this.pg = pgNew;
    this.pgMask = pgMaskNew;
    this.min = {x: minx, y:miny};
    this.max = {x: maxx, y:maxy};
  }

  draw() {
    if (!this.pg) return;
    push();
    blendMode(BLEND);
    translate(this.min.x, this.min.y);
    image(this.pg, 0, 0);
    blendMode(ADD);
    image(this.pgMask, 0, 0);
    pop();
  }

  drawMask(mx, my) {
    if (!this.pgMask) return;
    this.pgMask.fill(255);
    this.pgMask.noStroke();
    this.pgMask.ellipse(mx-this.min.x, my-this.min.y, 50, 50);
  }

  inpaint(sel) {
    let img_crop = this.pg.get(sel.x-this.min.x, sel.y-this.min.y, sel.w, sel.h);
    let img_mask = this.pgMask.get(sel.x-this.min.x, sel.y-this.min.y, sel.w, sel.h);
    socket.emit('inpaint', {
      image: img_crop.canvas.toDataURL("image/png"),
      mask: img_mask.canvas.toDataURL("image/png"),
      selection: sel
    });
  }  
}
  
  