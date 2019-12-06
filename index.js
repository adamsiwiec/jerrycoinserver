const express = require("express");
const http = require("http");
const socketIo = require("socket.io");


//Port from environment variable or default - 4001
const port = process.env.PORT || 4001;

//Setting up express and adding socketIo middleware
const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  transports: ['websocket']
});

const redis = require('redis');
const redisAdapter = require('socket.io-redis');
let pub = redis.createClient(process.env.REDIS_URL);
let sub = redis.createClient(process.env.REDIS_URL);

io.adapter(redisAdapter({
  pubClient: pub,
  subClient: sub
}));

let blockchain = [];
let TxPool = [];

io.on('connection', (socket) => {
  socket.on('getTxPool', () => {
    socket.emit("resTxPool", TxPool);
  });

   socket.on('getBlockchain', () => {
     socket.emit("resBlockchain", blockchain);
   });

  // when the client emits 'add user', this listens and executes
  socket.on('sendBlockchain', (bc) => {
    if(bc.length > blockchain.length) {
      blockchain = bc;
      TxPool = [];
      socket.broadcast.emit("bc", blockchain);
    }
    
  });

  socket.on('sendTx', (tx) => {
    TxPool.push(tx);
    socket.broadcast.emit("tx", TxPool);
  })

});
server.listen(port, () => console.log(`Listening on port ${port}`));