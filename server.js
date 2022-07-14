const PORT = process.env.PORT || 3000;
const express = require('express');
const app = express();
const http = require('http');
const axios = require('axios');
const server = http.createServer(app);
const io = require("socket.io")(server);
const config = require('./config.json');
const generator_url = config.generator_url;


app.use(express.static('public'));

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});

io.on('connection', (socket) => {
  console.log('Client connected');
  
  socket.on('disconnect', () => {
    console.log('Client disconnected');
  });

  async function run_generator_update(task_id, patch_idx) {
    let results = await axios.post(`${generator_url}/fetch`, {token: task_id});
    let status = results.data.status.status;
    let output = {patch_idx: patch_idx, status: status}
    let intermediateCreation = null;
    if (status == 'complete') {
      let creation = results.data.output.creation;
      output.creation = creation.data;
    }
    else if (status == 'running') {
      let progress = results.data.status.progress;
      progress = progress == "__none__" ? 0 : progress;
      output.progress = progress;
      if (results.data.output.intermediate_creation) {
        let newCreation = results.data.output.intermediate_creation.data;
        if (newCreation != intermediateCreation) {
          intermediateCreation = newCreation;
          output.creation = intermediateCreation;
        }
      }
    }
    socket.emit('creation', output);
    if (status == 'complete') {
      return;
    }
    setTimeout(function(){
      run_generator_update(task_id, patch_idx);
    }, 1000);
  }


  socket.on('inpaint', async (data) => {
    const creation_config = {
      "mode": "inpaint",
      "input_image": data.image,
      "mask_image": data.mask,
      "ddim_steps": 150
    }    
    let results = await axios.post(`${generator_url}/run`, creation_config);
    const task_id = results.data.token;
    run_generator_update(task_id, data.patch_idx);
  });

  socket.on('create', async (data) => {
    const creation_config = {
      "mode": "generate",
      "text_input": data.text_input,
      "C": 16,
      "f": 16,
      "ddim_steps": 150,
      "W": 512,
      "H": 512
    }    
    let results = await axios.post(`${generator_url}/run`, creation_config);
    const task_id = results.data.token;
    run_generator_update(task_id, data.patch_idx);
  });

});


server.listen(3000, () => {
  console.log('listening on port 3000');
});