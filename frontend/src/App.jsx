
import React from "react";
import KanbanBoard from "./components/KanbanBoard";
import { io } from "socket.io-client";

const socket = io("http://localhost:5000");

socket.on("connect", () => {
  console.log("CONNECTED TO BACKEND");
});

function App() {
  return (
    <div className="App">
      <KanbanBoard />
    </div>
  );
}

export default App;