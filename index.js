const express = require("express");
const http = require("http");
const socketIo = require("socket.io");

//Port from environment variable or default - 4001
const port = process.env.PORT || 4001;

//Setting up express and adding socketIo middleware
const app = express();
const server = http.createServer(app);
const io = socketIo(server);

class Block {

  //  index;
  //  hash;
  //  previousHash;
  //  timestamp;
  //  data;
  //  difficulty;
  //  nonce;

  constructor(index, hash, previousHash,
    timestamp, data, difficulty, nonce) {
    this.index = index;
    this.previousHash = previousHash;
    this.timestamp = timestamp;
    this.data = data;
    this.hash = hash;
    this.difficulty = difficulty;
    this.nonce = nonce;
  }
}

const genesisTransaction = {
  'txIns': [{
    'signature': '',
    'txOutId': '',
    'txOutIndex': 0
  }],
  'txOuts': [{
    'address': '04bfcab8722991ae774db48f934ca79cfb7dd991229153b9f732ba5334aafcd8e7266e47076996b55a14bf9913ee3145ce0cfc1372ada8ada74bd287450313534a',
    'amount': 50
  }],
  'id': 'e655f6a5f26dc9b4cac6e46f52336428287759cf81ef5ff10854f69d68f43fa3'
};

const genesisBlock = new Block(
  0, '91a73664bc84c0baa1fc75ea6e4aa6d1d20c5df664c724e3159aefc2e1186627', '', 1465154705, [genesisTransaction], 0, 0
);

let blockchain = [];
let TxPool = [];

io.on('connection', (socket) => {
  console.log("user connected");
  socket.on('getTxPool', () => {
    console.log("TxPool requested")
    socket.emit("resTxPool", TxPool);
  });

   socket.on('getBlockchain', () => {
     console.log("bc requested");
     socket.emit("resBlockchain", blockchain);
   });

  // when the client emits 'add user', this listens and executes
  socket.on('sendBlockchain', (bc) => {
    console.log("new blockchain received");
    console.log(bc);
    if(bc.length > blockchain.length) {
      blockchain = bc;
      TxPool = [];
      socket.broadcast.emit("bc", blockchain);
    }
    
  });

  socket.on('sendTx', (tx) => {
    console.log("new Transaction Pool Received");
    console.log(tx);
    //console.log(TxPool);
    TxPool.push(tx);
    socket.broadcast.emit("tx", TxPool);
  })

});
server.listen(port, () => console.log(`Listening on port ${port}`));