const PORT = process.env.PORT || 3000;
const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server);

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

});

// setInterval(() => {
//   io.emit('time', new Date().toTimeString()), 1000
// });

server.listen(3000, () => {
  console.log('listening on port 3000');
});