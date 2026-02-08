const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

io.on("connection", (socket) => {
  console.log("A user connected");

  socket.on("add-task", (task) =>{
    io.emit("task-added", task);
  });

  
  socket.on("move-to-progress", (task) => {
    
    io.emit("task-moved-to-progress", task);
  });

  socket.on("move-to-done", (task) => {
    
    io.emit("task-moved-to-done", task);
  });

  
});

server.listen(5000, () => console.log("Server running on port 5000"));
