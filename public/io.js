var socket;

var patchesLookup = {};
var patchesLookupIdx = 0;

function setupSocket() {
  socket = io.connect();
  socket.on('creation', receive_creation);
  socket.on('inpainting', receive_inpainting);
}

function receive_creation(data) {

  console.log(data.status)

  if (data.status == 'pending') {
    patchesLookup[data.patchIdx].status = "pending";
  }
  if (data.status == 'running') {
    patchesLookup[data.patchIdx].status = int(100*data.progress)+"% done";
  }

  if (!data.creation) {
    return;
  }

  var pimg = new Image();
  pimg.src = 'data:image/jpeg;base64,'+data.creation.data;
  pimg.onload = function() {
    var img = createImage(pimg.width, pimg.height);
    img.drawingContext.drawImage(pimg, 0, 0);
    patchesLookup[data.patchIdx].img = img;
  }
}

function receive_inpainting(data) {
  var pimg = new Image();
  pimg.src = 'data:image/jpeg;base64,'+data.creation.data;
  pimg.onload = function() {
    var img = createImage(pimg.width, pimg.height);
    img.drawingContext.drawImage(pimg, 0, 0);
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
    patchIdx: patchesLookupIdx
  });
  patchesLookupIdx++;
  prompt.value = '';
}