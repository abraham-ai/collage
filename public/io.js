// async function loadReplicate() {
//   const Replicate = await import('./replicate.js');
//   submitRequest = Replicate.submitRequest;
//   downloadResult = Replicate.downloadResult;
//   return {submitRequest: submitRequest, downloadResult: downloadResult}
// }
// let replicate = loadReplicate();

let replicate;

// var patchesLookup = {};
// var patchesLookupIdx = 0;

async function setupSocket() {
  socket = io.connect();
  replicate = await import('./replicate.js');
  //socket.on('creation', receive_creation);
}

/*
function receive_creation(data) {
  let patch = patchesLookup[data.patch_idx];
  patch.status = data.status;

  if (data.status.status == 'failed') {
    patch.buttonsAlwaysVisible = true;
    patch.setupButtons(false, false, true);
    patch.positionButtons();
  }

  if (!data.creation) {
    return;
  }

  var pimg = new Image();
  pimg.src = 'data:image/jpeg;base64,'+data.creation;
  pimg.onload = function() {
    var img = createImage(pimg.width, pimg.height);
    img.drawingContext.drawImage(pimg, 0, 0);
    img.resize(patch.w, patch.h)
    patch.img = img;
  }

  if (data.status.status == 'complete' && data.auto_stamp) {
    canvas.stamp(patch);
    var idx = patches.indexOf(patch);
    patches.splice(idx, 1);
  }
}
*/

async function submitPrompt() {
  let prompt = document.getElementById("prompt");
  if (prompt.value == '' || !selector) {
    return;
  }

  const auto_stamp = false;

  let newPatch = new Patch(null, true, false, false);  
  newPatch.set(selector.x, selector.y, selector.w, selector.h);
  newPatch.setupButtons(true, false, true);
  newPatch.positionButtons();  
  newPatch.prompt = prompt.value;

  //patchesLookup[patchesLookupIdx] = newPatch;
  patches.push(newPatch);
  

  // let settings = {
  //   text_input: prompt.value,
  //   patch_idx: patchesLookupIdx,
  //   window_size: selector.window_size,
  //   auto_stamp: false
  // }

  
  let config = {
    "text_input": prompt.value,
    "mode": "generate",
    "steps": 25,
    "width": selector.window_size.w,
    "height": selector.window_size.h
  }

  if (canvas.pg) {
    let img_crop = canvas.getImageSelection(selector);
    let img_mask = canvas.getMaskSelection(selector);

    img_crop.resize(selector.window_size.w, selector.window_size.h);
    img_mask.resize(selector.window_size.w, selector.window_size.h);

    img_crop.save('CROP.png')
    img_mask.save('MASK.png')

    // settings.image = img_crop.canvas.toDataURL("image/png");
    // settings.mask = img_mask.canvas.toDataURL("image/png");

    
    config.init_image_b64 = img_crop.canvas.toDataURL("image/png");
    config.mask_image_b64 = img_mask.canvas.toDataURL("image/png");
    config.init_image_strength = 0.0;
  }

  prompt.value = '';
  selector = null;

  
  let prediction = await replicate.submitRequest(config);

  if (!prediction || prediction.status=="failed") {
    newPatch.status = "failed";
    newPatch.buttonsAlwaysVisible = true;
    newPatch.setupButtons(false, false, true);
    newPatch.positionButtons();
    return;
  }

  newPatch.status = prediction.status;

  let data = await replicate.downloadResult(prediction);

  var pimg = new Image();
  pimg.src = 'data:image/jpeg;base64,'+data;
  pimg.onload = function() {
    var img = createImage(pimg.width, pimg.height);
    img.drawingContext.drawImage(pimg, 0, 0);
    img.resize(newPatch.w, newPatch.h)
    newPatch.img = img;
  }

  if (prediction.status == 'complete' && auto_stamp) {
    canvas.stamp(newPatch);
    var idx = patches.indexOf(newPatch);
    patches.splice(idx, 1);
  }

}




/*

function submitInpaint() {
  if (!selector) {
    return;
  }
  let img_crop = canvas.getImageSelection(selector);
  let img_mask = canvas.getMaskSelection(selector);

  img_crop.resize(selector.window_size.w, selector.window_size.h);
  img_mask.resize(selector.window_size.w, selector.window_size.h);
  
  let prompt = "A spaceship in a colorful galaxy"

  let newPatch = new Patch(null, false, false, false);
  newPatch.set(selector.x, selector.y, selector.w, selector.h);
  newPatch.setButtonsVisible(false);
  newPatch.borderWidth = 0;
  newPatch.prompt = prompt;
  // patchesLookup[patchesLookupIdx] = newPatch;
  patches.push(newPatch);

  socket.emit('inpaint', {
    image: img_crop.canvas.toDataURL("image/png"),
    mask: img_mask.canvas.toDataURL("image/png"),
    text_input: prompt,
    patch_idx: patchesLookupIdx,
    window_size: selector.window_size,
    auto_stamp: false
  });
  patchesLookupIdx++;
  selector = null;
}
*/

function copySelection() {
  if (!selector || !canvas.pg) {
    return;
  }
  
  let newPatch = new Patch(null, true, false, false);
  newPatch.set(selector.x+30, selector.y+30, selector.w, selector.h);
  newPatch.img = canvas.getMaskedImageSelection(selector);
  newPatch.setupButtons(true, false, true);
  newPatch.positionButtons();
  //patchesLookup[patchesLookupIdx] = newPatch;
  patches.push(newPatch);
  //patchesLookupIdx++;  
  selector = null;
}

function copyLasso() {
  if (!lasso || !canvas.pg) {
    return;
  }
  let img_selection = canvas.getMaskedImageSelection(lasso); 
  let lasso_mask = lasso.getMaskImage();
  img_selection.mask(lasso_mask);

  let newPatch = new Patch(null, true, false, false);
  newPatch.set(lasso.x+30, lasso.y+30, lasso.w, lasso.h);
  newPatch.img = img_selection;
  newPatch.setupButtons(true, false, true);
  newPatch.positionButtons();
  //patchesLookup[patchesLookupIdx] = newPatch;
  patches.push(newPatch);
  //patchesLookupIdx++;  
  lasso = null;
}

function fileDropped(file) {
  let newPatch = new Patch(null, true, false, false);
  loadImage(file.data, function (newImage) {
    newPatch.img = newImage;
    newPatch.set(mouse.x, mouse.y, newImage.width, newImage.height);
    newPatch.setupButtons(true, false, true);
    newPatch.positionButtons();
    //patchesLookup[patchesLookupIdx] = newPatch;
    patches.push(newPatch);
    // patchesLookupIdx++;  
  });
  isFileDragging = false;
}

function fileDragging() {
  isFileDragging = true;
}

function eraseSelection() {
  canvas.erase(selector);
  selector = null;
}

function eraseLasso() {
  canvas.erase(lasso);
  lasso = null;
}