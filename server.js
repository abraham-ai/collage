const PORT = process.env.PORT || 3000;

const express = require('express');
const http = require('http');
const url = require('url');
const axios = require('axios');
const {createProxyMiddleware} = require('http-proxy-middleware');

const app = express();
const server = http.createServer(app);
const io = require("socket.io")(server);

// this comes up blank unless properly set
const REPLICATE_API_TOKEN = process.env.REPLICATE_API_TOKEN;

app.use(express.static('public'));

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});

app.get('/dl', async (req, res) => {
  const replicateUrl = url.parse(req.url, true).query.url;
  if (!replicateUrl.startsWith('https://replicate.com/api/models/abraham-ai/eden-stable-diffusion/files/')) {
    res.status(400).send("Wrong URL");
  }
  const obj = await axios.get(replicateUrl, {  
    headers: {
      'Authorization': "Token "+REPLICATE_API_TOKEN,
      'Content-Type': "application/json",
      'Accept': "application/json",      
    },
    responseType: 'arraybuffer',
  });
  const base64image = Buffer.from(obj.data, 'binary').toString('base64');
  res.send({result: base64image});
});

app.use('/api/', createProxyMiddleware({
  router: (req) => req.originalUrl.replace(/.*https?:\/\//, 'https://'),
  changeOrigin: true,
  pathRewrite: { '.*': '' },
  onProxyReq: (proxyReq) => {
    proxyReq.setHeader('Authorization', `Token ${REPLICATE_API_TOKEN}`);
  },
  onProxyRes: (proxyRes) => {
    proxyRes.headers['Access-Control-Allow-Origin'] = '*';
    proxyRes.headers['Access-Control-Allow-Headers'] = '*';
    delete proxyRes.headers['content-type'];
  }
}));

server.listen(3000, () => {
  console.log('listening on port 3000');
});
