var socket;

var patchesLookup = {};
var patchesLookupIdx = 0;

function setupSocket() {
  socket = io.connect();
  socket.on('creation', receive_creation);
}

function receive_creation(data) {
  let patch = patchesLookup[data.patch_idx];
  if (data.status == 'pending') {
    patch.status = "pending";
  } else if (data.status == 'running') {
    patch.status = int(100*data.progress)+"% done";
  } else if (data.status == 'complete') {
    patch.status = null;
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

  if (data.status == 'complete' && data.auto_paste) {
    canvas.paste(patch);
    var idx = patches.indexOf(patch);
    patches.splice(idx, 1);
  }
}

function submitPrompt() {
  let prompt = document.getElementById("prompt");
  if (prompt.value == '' || !selector) {
    return;
  }
  var newPatch = new Patch(null, true, false, false);
  newPatch.set(selector.x, selector.y, selector.w, selector.h);
  newPatch.prompt = prompt.value;
  patchesLookup[patchesLookupIdx] = newPatch;
  patches.push(newPatch);
  socket.emit('create', {
    text_input: prompt.value,
    patch_idx: patchesLookupIdx,
    window_size: selector.window_size,
    auto_paste: false
  });
  patchesLookupIdx++;
  prompt.value = '';
  selector = null;
}

function submitInpaint() {
  if (!selector) {
    return;
  }
  let {img_crop, img_mask} = canvas.getInpaintingData(selector);
  img_crop.resize(selector.window_size.w, selector.window_size.h);
  img_mask.resize(selector.window_size.w, selector.window_size.h);
  let newPatch = new Patch(null, false, false, false);
  newPatch.set(selector.x, selector.y, selector.w, selector.h);
  patchesLookup[patchesLookupIdx] = newPatch;
  patches.push(newPatch);
  socket.emit('inpaint', {
    image: img_crop.canvas.toDataURL("image/png"),
    mask: img_mask.canvas.toDataURL("image/png"),
    patch_idx: patchesLookupIdx,
    window_size: selector.window_size,
    auto_paste: true
  });
  patchesLookupIdx++;
  selector = null;
}

function fileDropped(file) {
  let img = createImg(file.data, successCallback = () => {
    let newPatch = new Patch(null, true, false, false);
    newPatch.img = img;
    newPatch.set(mouse.x, mouse.y, img.width, img.height);
    patchesLookup[patchesLookupIdx] = newPatch;
    patches.push(newPatch);
    patchesLookupIdx++;  
  }).hide();
}
