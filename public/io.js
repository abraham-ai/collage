var socket;

var patchesLookup = {};
var patchesLookupIdx = 0;

function setupSocket() {
  socket = io.connect();
  socket.on('creation', receive_creation);
}

function receive_creation(data) {
  if (data.status == 'pending') {
    patchesLookup[data.patch_idx].status = "pending";
  } else if (data.status == 'running') {
    patchesLookup[data.patch_idx].status = int(100*data.progress)+"% done";
  } else if (data.status == 'complete') {
    patchesLookup[data.patch_idx].status = null;
  }
  if (!data.creation) {
    return;
  }
  var pimg = new Image();
  pimg.src = 'data:image/jpeg;base64,'+data.creation;
  pimg.onload = function() {
    var img = createImage(pimg.width, pimg.height);
    img.drawingContext.drawImage(pimg, 0, 0);
    patchesLookup[data.patch_idx].img = img;
  }
}

function submitPrompt() {
  let prompt = document.getElementById("prompt");
  var position = {
    x: (trans.x+width/2-256)/zoom,
    y: (trans.y+height/2-256)/zoom
  };
  var newPatch = new Patch(false, true, null);
  newPatch.set(position.x, position.y, 512, 512);
  patchesLookup[patchesLookupIdx] = newPatch;
  patches.push(newPatch);
  socket.emit('create', {
    text_input: prompt.value,
    patch_idx: patchesLookupIdx
  });
  patchesLookupIdx++;
  prompt.value = '';
}

function submitInpaint() {
  let {img_crop, img_mask} = canvas.getInpaintingData(selector)
  patchesLookup[patchesLookupIdx] = selector;
  patches.push(selector);
  socket.emit('inpaint', {
    image: img_crop.canvas.toDataURL("image/png"),
    mask: img_mask.canvas.toDataURL("image/png"),
    patch_idx: patchesLookupIdx
  });
  patchesLookupIdx++;
  prompt.value = '';
}

