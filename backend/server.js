// backend/server.js
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");

const app = express();
app.use(cors());
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// In-memory task storage
let tasks = [];

// Socket.IO connection
io.on("connection", (socket) => {
  console.log("A user connected: " + socket.id);

  // Send all tasks on new connection
  socket.emit("sync:tasks", tasks);

  // Add task
  socket.on("add-task", (task) => {
    tasks.push(task);
    io.emit("task-added", task);
    console.log("Task added:", task);
  });

  // Move to In Progress
  socket.on("move-to-progress", (task) => {
    tasks = tasks.map(t => {
      if (t.text === task.text) t.column = "InProgress";
      return t;
    });
    io.emit("task-moved-to-progress", { ...task, column: "InProgress" });
    console.log("Task moved to InProgress:", task.text);
  });

  // Move to Done
  socket.on("move-to-done", (task) => {
    tasks = tasks.map(t => {
      if (t.text === task.text) t.column = "Done";
      return t;
    });
    io.emit("task-moved-to-done", { ...task, column: "Done" });
    console.log("Task moved to Done:", task.text);
  });

  // Delete task
  socket.on("delete-task", (task) => {
    tasks = tasks.filter(t => t.text !== task.text);
    io.emit("task-deleted", task);
    console.log("Task deleted:", task.text);
  });

  socket.on("disconnect", () => {
    console.log("A user disconnected: " + socket.id);
  });
});

// Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
