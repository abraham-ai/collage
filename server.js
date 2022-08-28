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

  async function run_generator_update(task_id, patch_idx, auto_stamp) {
    let results = await axios.post(`${generator_url}/fetch`, {token: task_id});
    let status = results.data.status;
    let output = {patch_idx: patch_idx, status: status, auto_stamp: auto_stamp}
    let intermediateCreation = null;
    if (status.status == 'complete') {
      let creation = results.data.output.creation;
      output.creation = creation.data;
    }
    else if (status.status == 'running') {
      if (results.data.output.intermediate_creation) {
        let newCreation = results.data.output.intermediate_creation.data;
        if (newCreation != intermediateCreation) {
          intermediateCreation = newCreation;
          output.creation = intermediateCreation;
        }
      }
    }
    socket.emit('creation', output);
    if (status.status == 'running' ||
      status.status == 'queued' ||
      status.status == 'pending' ||
      status.status == 'starting' ||
      status.status == 'invalid token') {
      setTimeout(function(){
        run_generator_update(task_id, patch_idx, auto_stamp);
      }, 1000);
    }
  }

  socket.on('inpaint', async (data) => {
    const creation_config = {
      "mode": "inpaint",
      "input_image": data.image,
      "mask_image": data.mask,
      "ddim_steps": 100,
      "width": data.window_size.w,
      "height": data.window_size.h
    }    
    let results = await axios.post(`${generator_url}/run`, creation_config);
    const task_id = results.data.token;
    run_generator_update(task_id, data.patch_idx, data.auto_stamp);
  });

  socket.on('create', async (data) => {
    const creation_config = {
      "mode": "generate",
      "text_input": data.text_input,
      "C": 4, 
      "f": 8, 
      "ddim_steps": 50, 
      "width": data.window_size.w,
      "height": data.window_size.h
    }    
    let results = await axios.post(`${generator_url}/run`, creation_config);
    const task_id = results.data.token;
    run_generator_update(task_id, data.patch_idx, data.auto_stamp);
  });

});


server.listen(3000, () => {
  console.log('listening on port 3000');
});