import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Dashboard() {
  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  
  const [newProjectName, setNewProjectName] = useState('');
  const [taskForm, setTaskForm] = useState({ title: '', description: '', priority: 'Medium', dueDate: '' });
  
  const navigate = useNavigate();
  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const BACKEND_URL = "https://team-task-manager-production-58d4.up.railway.app";

  useEffect(() => {
    if (!token) { navigate('/'); return; }
    fetchData();
  }, [navigate, token]);

  const fetchData = async () => {
    try {
      const headers = { 'x-auth-token': token };
      const [tasksRes, projsRes] = await Promise.all([
        fetch(`${BACKEND_URL}/api/tasks`, { headers }),
        fetch(`${BACKEND_URL}/api/projects`, { headers })
      ]);
      setTasks(await tasksRes.json());
      setProjects(await projsRes.json());
    } catch (err) {
      console.error("Error pulling database profiles", err);
    }
  };

  const handleCreateProject = async (e) => {
    e.preventDefault();
    await fetch(`${BACKEND_URL}/api/projects`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-auth-token': token },
      body: JSON.stringify({ name: newProjectName, admin: user.id || user._id })
    });
    setNewProjectName('');
    fetchData();
  };

  const handleCreateTask = async (e) => {
    e.preventDefault();
    if (!projects || !projects.length) return alert("Initialize a project container first!");
    
    await fetch(`${BACKEND_URL}/api/tasks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-auth-token': token },
      body: JSON.stringify({ 
        title: taskForm.title,
        description: taskForm.description,
        priority: taskForm.priority,
        dueDate: taskForm.dueDate,
        project: projects[0]._id
      })
    });
    setTaskForm({ title: '', description: '', priority: 'Medium', dueDate: '' });
    fetchData();
  };

  const updateStatus = async (taskId, newStatus) => {
    await fetch(`${BACKEND_URL}/api/tasks/${taskId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'x-auth-token': token },
      body: JSON.stringify({ status: newStatus })
    });
    fetchData();
  };

  const taskArray = Array.isArray(tasks) ? tasks : [];
  const todoTasks = taskArray.filter(t => t.status === 'Todo' || t.status === 'todo');
  const inProgressTasks = taskArray.filter(t => t.status === 'In Progress');
  const doneTasks = taskArray.filter(t => t.status === 'Done');
  
  const overdueTasks = taskArray.filter(t => {
    if (!t.dueDate || t.status === 'Done') return false;
    return new Date(t.dueDate) < new Date();
  });

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 font-sans antialiased">
      {/* Premium Top Navigation Bar */}
      <div className="flex justify-between items-center mb-8 bg-slate-900/40 backdrop-blur-md p-6 rounded-2xl border border-slate-800 shadow-xl">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
            <span className="bg-indigo-600 w-3 h-6 rounded-sm inline-block"></span> Control Center
          </h1>
          <p className="text-xs text-slate-400 font-medium mt-1">
            Operator: <span className="text-slate-200 font-semibold">{user.name || 'Anonymous User'}</span> | Security Tier: <span className="text-indigo-400 font-semibold">{user.role}</span>
          </p>
        </div>
        <button onClick={() => { localStorage.clear(); navigate('/'); }} className="bg-slate-800 hover:bg-red-950/40 text-slate-300 hover:text-red-400 font-semibold px-4 py-2 rounded-xl transition border border-slate-700 hover:border-red-900/60 text-xs tracking-wider uppercase">
          Terminate Session
        </button>
      </div>

      {/* Analytics Counter Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-slate-900/60 p-5 rounded-2xl border border-slate-800 shadow-md">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Active Backlog</span>
          <span className="text-2xl font-black text-white block mt-2">{taskArray.length} Tasks</span>
        </div>
        <div className="bg-slate-900/60 p-5 rounded-2xl border border-slate-800 shadow-md">
          <span className="text-[10px] font-bold text-cyan-500 uppercase tracking-widest">In Execution</span>
          <span className="text-2xl font-black text-cyan-400 block mt-2">{inProgressTasks.length} Live</span>
        </div>
        <div className="bg-slate-900/60 p-5 rounded-2xl border border-slate-800 shadow-md">
          <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest">Resolved Targets</span>
          <span className="text-2xl font-black text-emerald-400 block mt-2">{doneTasks.length} Completed</span>
        </div>
        <div className="bg-slate-900/60 p-5 rounded-2xl border border-slate-800 shadow-md bg-red-950/10 border-red-900/30">
          <span className="text-[10px] font-bold text-red-500 uppercase tracking-widest">Breached Deadlines</span>
          <span className="text-2xl font-black text-red-400 block mt-2">{overdueTasks.length} Latent</span>
        </div>
      </div>

      {/* Admin Operations Console */}
      {user.role === 'Admin' && (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-8">
          <div className="bg-slate-900/40 p-5 rounded-2xl border border-slate-800 xl:col-span-1 shadow-inner">
            <h3 className="font-bold text-xs tracking-widest uppercase text-slate-400 mb-4">Initialize Container</h3>
            <form onSubmit={handleCreateProject} className="space-y-3">
              <input type="text" placeholder="Project name/ID..." className="w-full bg-slate-950 border border-slate-800 p-3 text-xs rounded-xl outline-none text-white focus:ring-1 focus:ring-indigo-500" value={newProjectName} onChange={(e) => setNewProjectName(e.target.value)} required />
              <button type="submit" className="w-full bg-slate-100 hover:bg-white text-slate-950 text-xs font-bold py-3 rounded-xl transition shadow-lg">Deploy Project Module</button>
            </form>
          </div>

          <div className="bg-slate-900/40 p-5 rounded-2xl border border-slate-800 xl:col-span-2 shadow-inner">
            <h3 className="font-bold text-xs tracking-widest uppercase text-slate-400 mb-4">Deploy Task Payload</h3>
            <form onSubmit={handleCreateTask} className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <input type="text" placeholder="Task objective..." className="bg-slate-950 border border-slate-800 p-3 text-xs rounded-xl outline-none focus:ring-1 focus:ring-indigo-500 text-white" value={taskForm.title} onChange={(e) => setTaskForm({...taskForm, title: e.target.value})} required />
              <input type="text" placeholder="Functional description..." className="bg-slate-950 border border-slate-800 p-3 text-xs rounded-xl outline-none focus:ring-1 focus:ring-indigo-500 text-white" value={taskForm.description} onChange={(e) => setTaskForm({...taskForm, description: e.target.value})} />
              <select className="bg-slate-950 border border-slate-800 p-3 text-xs rounded-xl outline-none text-slate-300 focus:ring-1 focus:ring-indigo-500" value={taskForm.priority} onChange={(e) => setTaskForm({...taskForm, priority: e.target.value})}>
                <option value="Low">Low Priority</option>
                <option value="Medium">Medium Priority</option>
                <option value="High">High Priority</option>
              </select>
              <input type="date" className="bg-slate-950 border border-slate-800 p-3 text-xs rounded-xl outline-none text-slate-300 focus:ring-1 focus:ring-indigo-500" value={taskForm.dueDate} onChange={(e) => setTaskForm({...taskForm, dueDate: e.target.value})} />
              <button type="submit" className="md:col-span-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs py-3 rounded-xl transition shadow-lg shadow-indigo-600/10" disabled={!projects.length}>+ Commit Task Structure</button>
            </form>
          </div>
        </div>
      )}

      {/* Production Kanban Pipeline Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* TODO Column */}
        <div className="bg-slate-900/20 p-4 rounded-2xl border border-slate-800/80 min-h-[550px] flex flex-col">
          <h2 className="font-bold text-xs uppercase tracking-widest text-slate-400 mb-4 flex items-center justify-between bg-slate-900/60 p-3 rounded-xl border border-slate-800">
            <span>📌 Assigned Backlog</span> <span className="bg-slate-800 px-2 py-0.5 rounded text-[10px] font-black text-slate-300">{todoTasks.length}</span>
          </h2>
          <div className="space-y-3 flex-1 overflow-y-auto">
            {todoTasks.map(task => (
              <div key={task._id} className="bg-slate-900/60 p-4 rounded-xl border border-slate-800 hover:border-slate-700 transition shadow-sm">
                <div className="flex justify-between items-start gap-2">
                  <h4 className="font-bold text-white text-sm tracking-tight">{task.title}</h4>
                  <span className={`text-[9px] px-2 py-0.5 rounded-md font-black uppercase tracking-wider ${task.priority === 'High' ? 'bg-red-950 text-red-400 border border-red-900' : task.priority === 'Medium' ? 'bg-amber-950 text-amber-400 border border-amber-900' : 'bg-slate-800 text-slate-400'}`}>{task.priority}</span>
                </div>
                <p className="text-xs text-slate-400 mt-2 leading-relaxed font-normal">{task.description || 'No conceptual blueprint provided.'}</p>
                {task.dueDate && <p className="text-[10px] text-slate-500 mt-3 font-semibold tracking-wide">📅 target: {new Date(task.dueDate).toLocaleDateString()}</p>}
                <button onClick={() => updateStatus(task._id, 'In Progress')} className="mt-4 text-[11px] bg-indigo-600/10 hover:bg-indigo-600 text-indigo-400 hover:text-white border border-indigo-900/50 hover:border-transparent font-bold py-2 rounded-lg w-full transition text-center">Commence Run ➡️</button>
              </div>
            ))}
          </div>
        </div>

        {/* IN PROGRESS Column */}
        <div className="bg-slate-900/20 p-4 rounded-2xl border border-slate-800/80 min-h-[550px] flex flex-col">
          <h2 className="font-bold text-xs uppercase tracking-widest text-cyan-400 mb-4 flex items-center justify-between bg-slate-900/60 p-3 rounded-xl border border-slate-800">
            <span>⏳ Execution Pipeline</span> <span className="bg-cyan-950 text-cyan-400 px-2 py-0.5 rounded text-[10px] font-black">{inProgressTasks.length}</span>
          </h2>
          <div className="space-y-3 flex-1 overflow-y-auto">
            {inProgressTasks.map(task => (
              <div key={task._id} className="bg-slate-900/60 p-4 rounded-xl border border-slate-800 hover:border-slate-700 transition shadow-sm">
                <div className="flex justify-between items-start gap-2">
                  <h4 className="font-bold text-white text-sm tracking-tight">{task.title}</h4>
                  <span className={`text-[9px] px-2 py-0.5 rounded-md font-black uppercase tracking-wider ${task.priority === 'High' ? 'bg-red-950 text-red-400 border border-red-900' : 'bg-amber-950 text-amber-400'}`}>{task.priority}</span>
                </div>
                <p className="text-xs text-slate-400 mt-2 leading-relaxed">{task.description}</p>
                {task.dueDate && <p className="text-[10px] text-slate-500 mt-3 font-semibold tracking-wide">📅 target: {new Date(task.dueDate).toLocaleDateString()}</p>}
                <div className="grid grid-cols-2 gap-2 mt-4">
                  <button onClick={() => updateStatus(task._id, 'Todo')} className="text-[11px] bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold py-2 rounded-lg transition">⬅️ Revert</button>
                  <button onClick={() => updateStatus(task._id, 'Done')} className="text-[11px] bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2 rounded-lg transition shadow-md shadow-emerald-600/10">Resolve ✓</button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* DONE Column */}
        <div className="bg-slate-900/20 p-4 rounded-2xl border border-slate-800/80 min-h-[550px] flex flex-col">
          <h2 className="font-bold text-xs uppercase tracking-widest text-emerald-400 mb-4 flex items-center justify-between bg-slate-900/60 p-3 rounded-xl border border-slate-800">
            <span>✅ Completed History</span> <span className="bg-emerald-950 text-emerald-400 px-2 py-0.5 rounded text-[10px] font-black">{doneTasks.length}</span>
          </h2>
          <div className="space-y-3 flex-1 overflow-y-auto">
            {doneTasks.map(task => (
              <div key={task._id} className="bg-slate-900/30 p-4 rounded-xl border border-slate-900/60 shadow-sm opacity-70">
                <h4 className="font-bold text-slate-500 text-sm line-through tracking-tight">{task.title}</h4>
                <p className="text-xs text-slate-600 mt-1 line-through">{task.description}</p>
                <button onClick={() => updateStatus(task._id, 'In Progress')} className="mt-4 text-[10px] bg-slate-800/60 hover:bg-slate-800 text-slate-400 font-bold py-1.5 rounded-lg w-full transition border border-slate-800">🔄 Reopen Objective</button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}