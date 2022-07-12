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


  socket.on('sendtest2', async (data) => {
    console.log(data);
    var data2 = {"theproduct": data.product}
    socket.emit('test2', data2)

  });


  socket.on('inpaint', async (data) => {

    const creation_config = {
      "mode": "inpaint",
      "input_image": data.image,
      "mask_image": data.mask,
      "ddim_steps": 150
    }
    
    let results = await axios.post(`${generator_url}/run`, creation_config);
    const task_id = results.data.token;
    console.log(task_id)
    
    async function run_generator_update() {
      results = await axios.post(`${generator_url}/fetch`, {token: task_id});

      console.log(results)

      if (results.data.status.status == 'complete') {
        let creation = results.data.output.creation;
        return socket.emit('inpainting', {
          creation: creation,
          selection: data.selection
        });
      }
      else if (results.data.status.status == 'pending') {
      }
      else if (results.data.status.status == 'queued') {
      }
      else if (results.data.status.status == 'running') {
      }


      setTimeout(function(){
        run_generator_update();
      }, 5000);
    }
    
    run_generator_update();
    
  });


  socket.on('create55', async (data) => {
    console.log("cvreate 4")
    socket.emit('creation88', {
      "hello": "world"
    });

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

    
    async function run_generator_update() {
      results = await axios.post(`${generator_url}/fetch`, {token: task_id});

      let status = results.data.status.status;
      let output = {patchIdx: data.patchIdx, status: status}

      if (status == 'complete') {
        let creation = results.data.output.creation;
        output.creation = creation;
      }
      else if (status == 'running') {
        let progress = results.data.status.progress;
        progress = progress == "__none__" ? 0 : progress;
        output.progress = progress;
      }

      socket.emit('creation', output);

      if (status == 'complete') {
        return;
      }

      setTimeout(function(){
        run_generator_update();
      }, 1000);
    }
    
    run_generator_update();
    
  });

});


server.listen(3000, () => {
  console.log('listening on port 3000');
});