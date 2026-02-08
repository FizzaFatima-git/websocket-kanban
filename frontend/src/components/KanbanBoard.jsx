import React from "react";
import { io } from "socket.io-client";
const socket =io("http://localhost:5000");

function KanbanBoard() {
  const [newTask, setNewTask] = React.useState("");
  const [priority, setPriority] = React.useState("Low");
  const [todoTasks, setTodoTasks] = React.useState([]);
  const [inProgressTasks, setInProgressTasks] = React.useState([]);
  const [doneTasks, setDoneTasks] = React.useState([]);

    


React.useEffect(() => {
  socket.on("task-added", (task) => {
    setTodoTasks((prev) => [...prev, task]);
  });

  socket.on("task-moved-to-progress", (task) => {
    setInProgressTasks((prev) => [...prev, task]);
    setTodoTasks((prev) => prev.filter((t) => t !== task));
  });

  socket.on("task-moved-to-done", (task) => {
    setDoneTasks((prev) => [...prev, task]);
    setInProgressTasks((prev) => prev.filter((t) => t !== task));
  });

  return () => {
    socket.off("task-added");
    socket.off("task-moved-to-progress");
    socket.off("task-moved-to-done");
  };
}, []);


  return (
    <div>
      <h1>Real-time Kanban Board</h1>

      <input
        type="text"
        value={newTask}
        onChange={(e) => setNewTask(e.target.value)}
      />
      <select value={priority} onChange={(e) => setPriority(e.target.value)}>
        <option value="Low">Low</option>
        <option value="Medium">Medium</option>
        <option value="High">High</option>
        
      </select>

      <button
        onClick={() => {
          if (newTask.trim() === "") return;
          socket.emit("add-task", {
            text: newTask,
            priority:priority
        });
          
          setNewTask("");
      }}
          
      
      >
        Add Task
      </button>

      <h2>To Do</h2>
      {todoTasks.map((task, index) => (
        <div key={index}>
          <p>
            {task.text} - <strong>{task.priority}
            </strong>
          </p>
          <button
            onClick={() => {
              socket.emit("move-to-progress", task);
            }}
          >
            Move to In Progress
          </button>
        </div>
      ))}

      <h2>In Progress</h2>
      {inProgressTasks.map((task, index) => (
        <div key={index}>
          <p>
            {task.text} - <strong>{task.priority}
            </strong>
          </p>}
          <button
            onClick={() => {
              socket.emit("move-to-done", task);
            }}
          >
            Move to Done
          </button>
        </div>
      ))}

      <h2>Done</h2>
      {doneTasks.map((task, index) => (
        <div key={index}>{task.text} - <strong>{task.priority}
        </strong>
      </div>
      ))}
    </div>
   
  );
}

export default KanbanBoard;