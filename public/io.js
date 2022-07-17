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

  if (data.status == 'complete') {
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
  var newPatch = new Patch(false, false, false, null);
  newPatch.set(selector.x, selector.y, selector.w, selector.h);
  patchesLookup[patchesLookupIdx] = newPatch;
  patches.push(newPatch);
  socket.emit('create', {
    text_input: prompt.value,
    patch_idx: patchesLookupIdx
  });
  patchesLookupIdx++;
  prompt.value = '';
  selector = null;
}

function submitInpaint() {
  if (!selector) {
    return;
  }
  selector.set(selector.x, selector.y, 512, 512);
  let {img_crop, img_mask} = canvas.getInpaintingData(selector);
  var newPatch = new Patch(false, false, false, null);
  newPatch.set(selector.x, selector.y, selector.w, selector.h);
  patchesLookup[patchesLookupIdx] = newPatch;
  patches.push(newPatch);
  socket.emit('inpaint', {
    image: img_crop.canvas.toDataURL("image/png"),
    mask: img_mask.canvas.toDataURL("image/png"),
    patch_idx: patchesLookupIdx
  });
  patchesLookupIdx++;
  selector = null;
}

