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
  console.log('a user connected');
  
  socket.on('disconnect', () => {
    console.log('Client disconnected');
  });

  socket.on('mouse', (data) => {
    console.log("Received: 'mouse' " + data.x + " " + data.y);
    socket.emit('mouse2', {x:data.x+100, y:data.y+50});
  });

  socket.on('try1', async (data) => {

    const creation_config = {
      "prompt": "hello stable diffusion"
    }

    const results = await axios.post(`${generator_url}/run`, creation_config);
    
    task_id = results.data.token;
    
  });

});

// setInterval(() => {
//   io.emit('time', new Date().toTimeString()), 1000
// });

server.listen(3000, () => {
  console.log('listening on port 3000');
});