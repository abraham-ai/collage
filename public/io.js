// TODO
// get in-progress images
// only crop/mask when needed
// in-progress images
// sign-in
// ------
// x eden backend + webhook
// x preprocess/inpaint cropped image
// feather mask


var socket;
var taskIds = [];
var patchesLookup = {};
var authToken = null;

const GATEWAY_URL = "https://gateway-test.abraham.ai"  // "https://app.dev.aws.abraham.fun"
const MINIO_URL = "https://minio.aws.abraham.fun"
const MINIO_BUCKET = "creations-stg"


function setupSocket() {

  // this is just a test example
  let postData = {"userId":"0x9974fD79DDF058E99a018ebd1Fce89CE23f4B874", "userType": "ethereum", "signature":"0xc316c04db61d853e3e1a22e658dbe254b70caeeaeeee115eb472c2d74455ce1c51452042dd1deceae0633843cd7026c704b5fe282b7722e5f93cb046a6ccb28d1c", "message": "this is my messag3e1"};

  httpPost(`${GATEWAY_URL}/sign_in`, 'json', postData, function(result) {
    authToken = result.authToken;
    setInterval(runUpdate, 1000);
  });  
  //socket = io.connect();
  //socket.on('creation', receive_creation);
}

function runUpdate() {
  
  if (taskIds.length == 0) {
    return;
  }

  httpPost(`${GATEWAY_URL}/fetch`, 'json', {"taskIds": taskIds}, 
    function(result) {
      for (let i = 0; i < result.length; i++) {
        let task = result[i];
        if (task.status == "failed") {
          console.log("task failed", task);
        }
        else if (task.status == "complete") {
          let sha = task.output;
          let taskId = task.generator.task_id;
          let imgUrl = `${MINIO_URL}/${MINIO_BUCKET}/${sha}`;
          let patch = patchesLookup[taskId];
          // patch.status = task.status;
          loadImage(imgUrl, function(img) {
            img.resize(patch.w, patch.h)
            patch.img = img;
            canvas.stamp(patch);
            patches.splice(patches.indexOf(patch), 1);
            taskIds.splice(taskIds.indexOf(taskId), 1);
          });
        }
      }
    }, 
    function(error) {
      // todo: need better error handling
      console.log("there is an error", error.message);
    }
  );

}

function submitPrompt() {
  let prompt = document.getElementById("prompt");
  if (prompt.value == '' || !selector) {
    return;
  }

  let config = {
    "mode": "generate", 
    "text_input": prompt.value,
    "sampler": "euler_ancestral",
    "scale": 12.0,
    "steps": 50, 
    "width": selector.window_size.w,
    "height": selector.window_size.h,
    "seed": int(1e8 * Math.random()),
    "mask_invert": true
  }

  if (canvas.pg && canvas.intersects(selector) && !canvas.selectionIsTransparent(selector)) {
    console.log("get a crop")
    let img_crop = canvas.getImageSelection(selector);
    let img_mask = canvas.getMaskSelection(selector);
    img_crop.resize(selector.window_size.w, selector.window_size.h);
    img_mask.resize(selector.window_size.w, selector.window_size.h);
    // img_crop.save('CROP.png')
    // img_mask.save('MASK.png')
    config.init_image_b64 = img_crop.canvas.toDataURL("image/png");
    config.mask_image_b64 = img_mask.canvas.toDataURL("image/png");
    config.init_image_strength = 0.0;
    config.init_image_inpaint_mode = "cv2_telea";
    config.mask_invert = true;
  } else {
    console.log("no crop")

  }

  const postData = {
    "token": authToken,
    "application": "collage", 
    "generator_name": "stable-diffusion", 
    "config": config
  }
    
  let newPatch = new Patch(null, false, false, false);
  newPatch.set(selector.x, selector.y, selector.w, selector.h);
  newPatch.setButtonsVisible(false);
  newPatch.prompt = prompt.value;
  
  httpPost(`${GATEWAY_URL}/request`, 'text', postData, 
    function(result) {
      const taskId = result;
      patchesLookup[taskId] = newPatch;
      patches.push(newPatch);
      newPatch.status = {status: "pending", progress: 0};
      taskIds.push(taskId);
      prompt.value = '';
      selector = null;
    }, 
    function(error) {
      console.log(error);
    }
  );
}

function copySelection() {
  if (!selector || !canvas.pg) {
    return;
  }
  
  let newPatch = new Patch(null, true, false, false);
  newPatch.set(selector.x+30, selector.y+30, selector.w, selector.h);
  newPatch.img = canvas.getMaskedImageSelection(selector);
  newPatch.setupButtons(true, false, true);
  newPatch.positionButtons();
  patches.push(newPatch);
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
  patches.push(newPatch);
  lasso = null;
}

function fileDropped(file) {
  let newPatch = new Patch(null, true, false, false);
  loadImage(file.data, function (newImage) {
    newPatch.img = newImage;
    newPatch.set(mouse.x, mouse.y, newImage.width, newImage.height);
    newPatch.setupButtons(true, false, true);
    newPatch.positionButtons();
    patches.push(newPatch);
  }).hide();
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
