const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const PORT =   5050; // server/server.js

const app = express();
const server = http.createServer(app);

app.use(cors());

const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000", // React app URL
    methods: ["GET", "POST"]
  }
});

io.on('connection', (socket) => {
  console.log('A user connected');

  socket.on('join', (username) => {
    console.log(`${username} joined`);
  });

  socket.on('chatMessage', (payload) => {
    console.log('Message:', payload);
    io.emit('chatMessage', payload); // 🟢 Broadcast to all clients
  });

  socket.on('disconnect', () => {
    console.log('A user disconnected');
  });
});

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
