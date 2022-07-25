class Canvas {

  constructor() {
    this.min = {x:1e8, y:1e8};
    this.max = {x:-1e8, y:-1e8};
    this.pg = null;
    this.pgMask = null;
  }
      
  paste(patch) {
    console.log("lets patch?")
    console.log("do i have img inside", patch.img)
    let minx = min(this.min.x, patch.x);
    let miny = min(this.min.y, patch.y);
    let maxx = max(this.max.x, patch.x+patch.w);
    let maxy = max(this.max.y, patch.y+patch.h);

    console.log("patch", patch.x, patch.y, patch.w, patch.h)
    let pgNew = createGraphics(maxx-minx, maxy-miny);
    let pgMaskNew = createGraphics(maxx-minx, maxy-miny);
    console.log(minx, miny, maxx, maxy);
    pgNew.push();
    if (this.pg) {
      pgNew.image(this.pg, this.min.x-minx, this.min.y-miny);
    }
    pgNew.fill(255);
    console.log("pdsfkjdsf")
    if (patch.img) {
      console.log("lets draw to", patch.x-minx, patch.y-miny, patch.w, patch.h)
      pgNew.image(patch.img, patch.x-minx, patch.y-miny, patch.w, patch.h);
    } else {
      console.log("no img")
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
    this.min = {x: minx, y:miny};
    this.max = {x: maxx, y:maxy};
  }

  draw() {
    if (!this.pg) return;
    this.pgFinal = this.pg.get();
    this.pgFinal.mask(this.pgMask.get());
    push();
    translate(this.min.x, this.min.y);
    image(this.pgFinal, 0, 0);
    pop();
  }

  drawMask(mx, my) {
    if (!this.pgMask) return;
    this.pgMask.erase();
    this.pgMask.fill(255);
    this.pgMask.noStroke();
    this.pgMask.ellipse(mx-this.min.x, my-this.min.y, 50, 50);
    this.pgMask.noErase();
  }

  getInpaintingData(selector) {
    let x = selector.x - this.min.x;
    let y = selector.y - this.min.y;
    let w = max(0, selector.x + selector.w - this.max.x);
    let h = max(0, selector.y + selector.h - this.max.y);

    let img_crop = this.pg.get(
      selector.x - this.min.x, 
      selector.y - this.min.y, 
      selector.w, selector.h
    );

    let img_mask = this.pgMask.get(
      max(0, x), 
      max(0, y), 
      selector.w-w, selector.h-h
    );

    let pgMaskWhite = createGraphics(selector.w, selector.h);
    pgMaskWhite.background(255);
    pgMaskWhite.image(img_mask, max(0, -x), max(0, -y));

    img_mask = pgMaskWhite.get(0, 0, selector.w, selector.h);

    return {img_crop, img_mask}
  }

}
  
  