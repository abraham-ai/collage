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
  

  socket.on('inpaint', async (data) => {

    
    const creation_config = {
      "mode": "inpaint",
      "input_image": data.image,
      "mask_image": data.mask,
      "ddim_steps": 50
    }
    
    let results = await axios.post(`${generator_url}/run`, creation_config);
    const task_id = results.data.token;
    console.log(task_id)
    
    async function run_generator_update() {
      results = await axios.post(`${generator_url}/fetch`, {token: task_id});

      console.log(results)

      if (results.data.status.status == 'complete') {
        
        let creation = results.data.output.creation;
        // socket.emit('creation', {
        //   creation: creation,
        //   mouse: data.mouse
        // });
        
        socket.emit('inpainting', {
          creation: creation,
          selection: data.selection
        });


        return;
      }
      setTimeout(function(){
        run_generator_update();
      }, 5000);
    }
    
    run_generator_update();


    
  });



  socket.on('create', async (data) => {

    const creation_config = {
      "mode": "generate",
      "text_input": data.text_input,
      "C": 16,
      "f": 16,
      "ddim_steps": 40,
      "W": 512,
      "H": 512
    }
    
    let results = await axios.post(`${generator_url}/run`, creation_config);
    const task_id = results.data.token;
    
    async function run_generator_update() {
      results = await axios.post(`${generator_url}/fetch`, {token: task_id});

      if (results.data.status.status == 'complete') {
        let creation = results.data.output.creation;
        socket.emit('creation', {
          creation: creation,
          mouse: data.mouse
        });
        return;
      }
      setTimeout(function(){
        run_generator_update();
      }, 5000);
    }
    
    run_generator_update();
    
  });

});


server.listen(3000, () => {
  console.log('listening on port 3000');
});