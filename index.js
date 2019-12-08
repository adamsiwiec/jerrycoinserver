const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const bluebird = require("bluebird");

//Port from environment variable or default - 4001
const port = process.env.PORT || 4001;

//Setting up express and adding socketIo middleware
const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  transports: ['websocket']
});

const redis = require('redis');
bluebird.promisifyAll(redis);

const redisAdapter = require('socket.io-redis');
let pub = redis.createClient(process.env.REDIS_URL);
let sub = redis.createClient(process.env.REDIS_URL);


io.adapter(redisAdapter({
  pubClient: pub,
  subClient: sub
}));


let getBlockchain = async () => {
  let blockchain = await pub.getAsync("bc");

  if(blockchain == null) return [];
  return JSON.parse(blockchain);
}

let getTxPool = async () => {
  let TxPool = await pub.getAsync("tx");
    if (TxPool == null) return [];
    return JSON.parse(TxPool);

}

let getUsers = async () => {
  let users = await pub.getAsync("users");
  if(users == null) return [];
  return JSON.parse(users);

}


io.on('connection', (socket) => {

  socket.on('setUser', async (userObject) => {
  let users = await getUsers();
  users = JSON.parse(users);
  users.push(userObject);
  socket.username = userObject;
  pub.set("users", users.toString());
  socket.broadcast.emit("users", users);
  });

  socket.on('getTxPool', async () => {
    socket.emit("users", await getUsers());
    socket.emit("resTxPool",await getTxPool());
  });

   socket.on('getBlockchain', async () => {
     socket.emit("resBlockchain", await getBlockchain());
   });

  // when the client emits 'add user', this listens and executes
  socket.on('sendBlockchain', async (bc) => {
    let block = await getBlockchain();
    if(bc.length > block.length) {
      pub.set("bc", JSON.stringify(bc));
      pub.set("tx", JSON.stringify([]));
      socket.broadcast.emit("bc", bc);
    }
    
  });

  socket.on('sendTx', async (tx) => {
    let TxPool = await getTxPool();
    TxPool.push(tx);
    pub.set("tx", JSON.stringify(TxPool));
    socket.broadcast.emit("tx", TxPool);
  })

  socket.on('disconnect', async () => {
    let users = await getUsers();
    users.remove()
    pub.set("users", users.toString());
  })

});
server.listen(port, () => console.log(`Listening on port ${port}`));