class Canvas {

  constructor() {
    this.min = {x: 1e8, y: 1e8};
    this.max = {x: -1e8, y: -1e8};
    this.pg = null;
    this.pgMask = null;
    this.pgEraser = [];
  }
  
  stamp(patch) {
    let minx = Math.round(min(this.min.x, patch.x));
    let miny = Math.round(min(this.min.y, patch.y));
    let maxx = Math.round(max(this.max.x, patch.x+patch.w));
    let maxy = Math.round(max(this.max.y, patch.y+patch.h));

    let pgNew = createGraphics(maxx-minx, maxy-miny);
    let pgMaskNew = createGraphics(maxx-minx, maxy-miny);
    pgNew.push();
    if (this.pg) {
      pgNew.image(this.pg, this.min.x-minx, this.min.y-miny);
    }
    pgNew.fill(255);
    if (patch.img) {
      pgNew.image(patch.img, patch.x-minx, patch.y-miny, patch.w, patch.h);
    }
    pgNew.pop();

    pgMaskNew.push();
    if (this.pgMask) {
      pgMaskNew.image(this.pgMask, this.min.x-minx, this.min.y-miny);
    }
    pgMaskNew.fill(0);
    pgMaskNew.noStroke();
    pgMaskNew.rect(patch.x-minx, patch.y-miny, patch.w, patch.h);
    pgMaskNew.pop();

    this.pg = pgNew;
    this.pgMask = pgMaskNew;
    this.min = {x: minx, y: miny};
    this.max = {x: maxx, y: maxy};

    this.updateFinal();
  }

  intersects(selector) {
    if (canvas.pg == null) {
      return false;
    }
    var minx = min(this.min.x, selector.x);
    var maxx = max(this.max.x, selector.x+selector.w);
    var miny = min(this.min.y, selector.y);
    var maxy = max(this.max.y, selector.y+selector.h);
    let intersect = (maxx - minx < (this.max.x - this.min.x) + selector.w);
    intersect = intersect && (maxy - miny < (this.max.y - this.min.y) + selector.h);
    return intersect;
  }

  draw() {
    if (!this.pg) return;
    push();
    translate(this.min.x, this.min.y);    
    noStroke();
    fill(255);
    image(this.pgFinal, 0, 0);
    for (var i=0; i<this.pgEraser.length; i++) {
      var e = this.pgEraser[i];
      ellipse(e[0], e[1], e[2]);
    }
    pop();
  }

  updateMask(mx, my) {
    if (!this.pgMask) return;
    if (mx >= this.min.x-eraserSize/2 && mx < this.max.x+eraserSize/2 &&
        my >= this.min.y-eraserSize/2 && my < this.max.y+eraserSize/2) {
      this.pgEraser.push([mx-this.min.x, my-this.min.y, eraserSize]);
    }
  }

  updateFinal() {
    this.pgMask.erase();
    this.pgMask.fill(255);
    this.pgMask.noStroke();
    for (var i=0; i<this.pgEraser.length; i++) {
      var e = this.pgEraser[i];
      this.pgMask.ellipse(e[0], e[1], e[2], e[2]);
    }
    this.pgMask.noErase();
    this.pgFinal = this.pg.get();
    this.pgFinal.mask(this.pgMask.get());
    this.pgEraser = [];
  }

  mouseReleased(mouse) {
    if (this.pgEraser.length == 0) {
      return;
    }
    this.updateFinal();
  }

  getImageSelection(selector) {
    let img_crop = this.pg.get(
      selector.x - this.min.x, 
      selector.y - this.min.y, 
      selector.w, selector.h
    );
    return img_crop;
  }

  getMaskSelection(selector) {
    let x = selector.x - this.min.x;
    let y = selector.y - this.min.y;
    let w = max(0, selector.x + selector.w - this.max.x);
    let h = max(0, selector.y + selector.h - this.max.y);

    let img_mask = this.pgMask.get(
      max(0, x), 
      max(0, y), 
      selector.w-w, selector.h-h
    );

    let pgMaskWhite = createGraphics(selector.w, selector.h);
    pgMaskWhite.background(255);
    pgMaskWhite.image(img_mask, max(0, -x), max(0, -y));

    img_mask = pgMaskWhite.get(0, 0, selector.w, selector.h);

    return img_mask;
  }

  getMaskedImageSelection(selector) {
    let img_crop = this.getImageSelection(selector);    
    let img_mask = this.getMaskSelection(selector);
    img_crop.loadPixels();
    img_mask.loadPixels();
    for (let x = 0; x < img_crop.width; x++) {
      for (let y = 0; y < img_crop.height; y++) {
        const p = 4 * (y * img_crop.width + x);
        img_crop.pixels[p + 3] = 255-img_mask.pixels[p];
      }
    }
    img_crop.updatePixels();
    return img_crop;
  }

  erase(selector) {
    if (!this.pgMask) return;
    this.pgMask.erase();
    this.pgMask.fill(255);
    this.pgMask.noStroke();
    selector.drawMask(this);
    this.pgMask.noErase();
    this.updateFinal();
  }

  save(filename) {
    if (!this.pg) {
      return;
    }
    this.pg.get().save(filename);
  }

}
