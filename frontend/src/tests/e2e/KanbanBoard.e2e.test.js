import React, { useState, useEffect } from "react";
import { io } from "socket.io-client";
import { DndProvider, useDrag, useDrop } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";

const socket = io("http://localhost:5000");

function Task({ task, moveTask, deleteTask }) {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: "TASK",
    item: task,
    collect: (monitor) => ({ isDragging: !!monitor.isDragging() }),
  }));

  return (
    <div
      ref={drag}
      style={{
        opacity: isDragging ? 0.5 : 1,
        border: "1px solid #ccc",
        padding: "8px",
        marginBottom: "8px",
        borderRadius: "4px",
        backgroundColor: "#fff",
      }}
    >
      <p>{task.text}</p>
      <p>Priority: {task.priority}</p>
      <p>Category: {task.category}</p>

      {/* File display */}
      {task.file && (
        task.file.type.startsWith("image/") ? 
          <img src={task.file.url} alt={task.file.name} style={{width: "50px"}} /> :
          <a href={task.file.url}>{task.file.name}</a>
      )}

      {task.column === "ToDo" && (
        <button onClick={() => moveTask(task, "InProgress")}>Move to In Progress</button>
      )}
      {task.column === "InProgress" && (
        <button onClick={() => moveTask(task, "Done")}>Move to Done</button>
      )}
      <button onClick={() => deleteTask(task)}>Delete</button>
    </div>
  );
}

function Column({ title, tasks, moveTask, deleteTask }) {
  const [, drop] = useDrop(() => ({
    accept: "TASK",
    drop: (task) => {
      if (title === "In Progress") moveTask(task, "InProgress");
      else if (title === "Done") moveTask(task, "Done");
    },
  }));

  return (
    <div
      ref={drop}
      id={title.replace(" ", "")} // Add ID for Playwright tests
      style={{
        width: "30%",
        minHeight: "200px",
        padding: "10px",
        border: "1px solid #000",
        borderRadius: "4px",
      }}
    >
      <h3>{title} ({tasks.length})</h3>
      {tasks.map((task, index) => (
        <Task key={index} task={task} moveTask={moveTask} deleteTask={deleteTask} />
      ))}
    </div>
  );
}

export default function KanbanBoard() {
  const [newTask, setNewTask] = useState("");
  const [priority, setPriority] = useState("Low");
  const [category, setCategory] = useState("Feature");
  const [file, setFile] = useState(null);

  const [todoTasks, setTodoTasks] = useState([]);
  const [inProgressTasks, setInProgressTasks] = useState([]);
  const [doneTasks, setDoneTasks] = useState([]);

  useEffect(() => {
    socket.on("sync:tasks", (allTasks) => {
      setTodoTasks(allTasks.filter(t => t.column === "ToDo"));
      setInProgressTasks(allTasks.filter(t => t.column === "InProgress"));
      setDoneTasks(allTasks.filter(t => t.column === "Done"));
    });

    socket.on("task-added", (task) => setTodoTasks(prev => [...prev, task]));
    socket.on("task-moved-to-progress", (task) => {
      setInProgressTasks(prev => [...prev, task]);
      setTodoTasks(prev => prev.filter(t => t.text !== task.text));
    });
    socket.on("task-moved-to-done", (task) => {
      setDoneTasks(prev => [...prev, task]);
      setInProgressTasks(prev => prev.filter(t => t.text !== task.text));
    });
    socket.on("task-deleted", (task) => {
      setTodoTasks(prev => prev.filter(t => t.text !== task.text));
      setInProgressTasks(prev => prev.filter(t => t.text !== task.text));
      setDoneTasks(prev => prev.filter(t => t.text !== task.text));
    });

    return () => {
      socket.off("sync:tasks");
      socket.off("task-added");
      socket.off("task-moved-to-progress");
      socket.off("task-moved-to-done");
      socket.off("task-deleted");
    };
  }, []);

  const addTask = () => {
    if (!newTask.trim()) return;
    const task = { text: newTask, priority, category, column: "ToDo", file };
    socket.emit("add-task", task);
    setNewTask("");
    setFile(null);
  };

  const moveTask = (task, column) => {
    if (column === "InProgress") socket.emit("move-to-progress", task);
    if (column === "Done") socket.emit("move-to-done", task);
  };

  const deleteTask = (task) => socket.emit("delete-task", task);

  const chartData = [
    { name: "To Do", tasks: todoTasks.length },
    { name: "In Progress", tasks: inProgressTasks.length },
    { name: "Done", tasks: doneTasks.length },
  ];

  return (
    <DndProvider backend={HTML5Backend}>
      <div style={{ padding: "20px" }}>
        <h1>Real-Time Kanban Board</h1>
        <input
          type="text"
          value={newTask}
          placeholder="Task title"
          onChange={(e) => setNewTask(e.target.value)}
        />
        <select value={priority} onChange={(e) => setPriority(e.target.value)}>
          <option value="Low">Low</option>
          <option value="Medium">Medium</option>
          <option value="High">High</option>
        </select>
        <select value={category} onChange={(e) => setCategory(e.target.value)}>
          <option value="Feature">Feature</option>
          <option value="Bug">Bug</option>
          <option value="Enhancement">Enhancement</option>
        </select>
        <input
          type="file"
          accept=".jpg,.jpeg,.png,.pdf"
          onChange={(e) => setFile(e.target.files[0])}
        />
        <button onClick={addTask}>Add Task</button>

        <h2>Task Progress Overview</h2>
        <BarChart width={400} height={200} data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis allowDecimals={false} />
          <Tooltip />
          <Bar dataKey="tasks" fill="#8884d8" />
        </BarChart>

        <div style={{ display: "flex", justifyContent: "space-between", marginTop: "20px" }}>
          <Column title="To Do" tasks={todoTasks} moveTask={moveTask} deleteTask={deleteTask} />
          <Column title="In Progress" tasks={inProgressTasks} moveTask={moveTask} deleteTask={deleteTask} />
          <Column title="Done" tasks={doneTasks} moveTask={moveTask} deleteTask={deleteTask} />
        </div>
      </div>
    </DndProvider>
  );
}
