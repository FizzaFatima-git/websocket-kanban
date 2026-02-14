import React, { useState, useEffect } from "react";
import { io } from "socket.io-client";
import { DndProvider, useDrag, useDrop } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";

const socket = io("http://localhost:5001");

// ---------- Task ----------
function Task({ task, moveTask, deleteTask }) {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: "TASK",
    item: task,
    collect: monitor => ({ isDragging: !!monitor.isDragging() }),
  }));

  return (
    <div
      ref={drag}
      style={{
        opacity: isDragging ? 0.5 : 1,
        border: "1px solid #aaa",
        padding: 8,
        marginBottom: 8,
        background: "white",
        borderRadius: 6
      }}
    >
      <b>{task.text}</b>
      <div>{task.priority} | {task.category}</div>

      {task.file && (
        <div style={{ fontSize: 12, color: "gray" }}>📎 {task.file}</div>
      )}

      {task.column === "ToDo" &&
        <button onClick={() => moveTask(task, "InProgress")}>Start</button>}

      {task.column === "InProgress" &&
        <button onClick={() => moveTask(task, "Done")}>Finish</button>}

      <button onClick={() => deleteTask(task)}>Delete</button>
    </div>
  );
}

// ---------- Column ----------
function Column({ title, tasks, moveTask, deleteTask }) {
  const [, drop] = useDrop(() => ({
    accept: "TASK",
    drop: (task) => {
      if (title === "In Progress") moveTask(task, "InProgress");
      if (title === "Done") moveTask(task, "Done");
    },
  }));

  return (
    <div
      ref={drop}
      style={{
        width: "30%",
        minHeight: 220,
        border: "2px solid black",
        padding: 10,
        borderRadius: 8,
        background: "#f5f5f5"
      }}
    >
      <h3>{title} ({tasks.length})</h3>
      {tasks.map(t =>
        <Task key={t.id} task={t} moveTask={moveTask} deleteTask={deleteTask} />
      )}
    </div>
  );
}

// ---------- Board ----------
export default function KanbanBoard() {

  const [text, setText] = useState("");
  const [priority, setPriority] = useState("Low");
  const [category, setCategory] = useState("Feature");
  const [file, setFile] = useState(null);

  const [todo, setTodo] = useState([]);
  const [progress, setProgress] = useState([]);
  const [done, setDone] = useState([]);

  // ---------- REALTIME LISTENERS ----------
  useEffect(() => {

    socket.on("sync:tasks", updateColumns);
    socket.on("task-added", task => updateColumns(prev => [...prev, task]));
    socket.on("task-moved-to-progress", updateColumns);
    socket.on("task-moved-to-done", updateColumns);
    socket.on("task-deleted", updateColumns);

    socket.emit("request-sync");

    return () => {
      socket.off("sync:tasks");
      socket.off("task-added");
      socket.off("task-moved-to-progress");
      socket.off("task-moved-to-done");
      socket.off("task-deleted");
    };

  }, []);

  // ---------- Split columns ----------
  function updateColumns(all) {
    if (!Array.isArray(all)) return;
    setTodo(all.filter(t => t.column === "ToDo"));
    setProgress(all.filter(t => t.column === "InProgress"));
    setDone(all.filter(t => t.column === "Done"));
  }

  // ---------- Add ----------
  const addTask = () => {
    if (!text.trim()) return;

    socket.emit("add-task", {
      id: Date.now(),
      text,
      priority,
      category,
      column: "ToDo",
      file: file ? file.name : null
    });

    setText("");
    setFile(null);
  };

  // ---------- Move ----------
  const moveTask = (task, col) => {
    if (col === "InProgress") socket.emit("move-to-progress", task);
    if (col === "Done") socket.emit("move-to-done", task);
  };

  // ---------- Delete ----------
  const deleteTask = (task) => socket.emit("delete-task", task);

  // ---------- Chart ----------
  const chartData = [
    { name: "To Do", tasks: todo.length },
    { name: "In Progress", tasks: progress.length },
    { name: "Done", tasks: done.length },
  ];

  return (
    <DndProvider backend={HTML5Backend}>
      <div style={{ padding: 20 }}>

        <h1>Real-Time Kanban Board</h1>

        <input
          value={text}
          onChange={e => setText(e.target.value)}
          placeholder="Task title"
        />

        <select value={priority} onChange={e => setPriority(e.target.value)}>
          <option>Low</option>
          <option>Medium</option>
          <option>High</option>
        </select>

        <select value={category} onChange={e => setCategory(e.target.value)}>
          <option>Feature</option>
          <option>Bug</option>
          <option>Enhancement</option>
        </select>

        <input type="file" onChange={(e)=>setFile(e.target.files[0])} />

        <button onClick={addTask}>Add Task</button>

        {/* Chart */}
        <h2 style={{marginTop:30}}>Task Progress Overview</h2>
        <BarChart width={420} height={220} data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis allowDecimals={false} />
          <Tooltip />
          <Bar dataKey="tasks" fill="#8884d8" />
        </BarChart>

        {/* Columns */}
        <div style={{display:"flex",gap:20,marginTop:30}}>
          <Column title="To Do" tasks={todo} moveTask={moveTask} deleteTask={deleteTask}/>
          <Column title="In Progress" tasks={progress} moveTask={moveTask} deleteTask={deleteTask}/>
          <Column title="Done" tasks={done} moveTask={moveTask} deleteTask={deleteTask}/>
        </div>

      </div>
    </DndProvider>
  );
}

