import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Dashboard() {
  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  
  // Form Allocation States
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
      console.error("Error pulling data metrics", err);
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

  // =========================================================================
  // UPDATED HOOK: Dynamic Assignment Handlers passing explicit validation keys
  // =========================================================================
  const handleCreateTask = async (e) => {
    e.preventDefault();
    if (!projects || !projects.length) return alert("Initialize a project container first!");
    
    // Fallback resolution: Ensures a true string/object ID mapping passes seamlessly 
    // to match what your Mongoose Schema validation rules look for.
    const currentUserId = user.id || user._id;

    await fetch(`${BACKEND_URL}/api/tasks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-auth-token': token },
      body: JSON.stringify({ 
        title: taskForm.title,
        description: taskForm.description,
        priority: taskForm.priority,
        dueDate: taskForm.dueDate,
        project: projects[0]._id, // Maps dynamically to your cloud container branch
        assignedTo: currentUserId  // Passes your explicitly verified active session ID
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

  // --- ANALYTICAL ENGINE COMPUTATIONS ---
  const taskArray = Array.isArray(tasks) ? tasks : [];
  const todoTasks = taskArray.filter(t => t.status === 'Todo' || t.status === 'todo');
  const inProgressTasks = taskArray.filter(t => t.status === 'In Progress');
  const doneTasks = taskArray.filter(t => t.status === 'Done');
  
  const overdueTasks = taskArray.filter(t => {
    if (!t.dueDate || t.status === 'Done') return false;
    return new Date(t.dueDate) < new Date();
  });

  return (
    <div className="min-h-screen bg-gray-50 p-6 font-sans">
      {/* Header Panel */}
      <div className="flex justify-between items-center mb-8 bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Workspace Management Console</h1>
          <p className="text-sm text-gray-500 font-medium mt-1">Operator: {user.name} | Security clearance: <span className="text-blue-600 font-semibold">{user.role}</span></p>
        </div>
        <button onClick={() => { localStorage.clear(); navigate('/'); }} className="bg-red-500 hover:bg-red-600 text-white font-bold px-5 py-2.5 rounded-lg transition shadow-sm text-sm">
          Disconnect Session
        </button>
      </div>

      {/* DASHBOARD METRICS CARDS SECTION */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex flex-col">
          <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Total Active Load</span>
          <span className="text-3xl font-black text-gray-800 mt-2">{taskArray.length} Tasks</span>
        </div>
        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex flex-col">
          <span className="text-xs font-bold text-blue-400 uppercase tracking-wider">In Flight Tracker</span>
          <span className="text-3xl font-black text-blue-600 mt-2">{inProgressTasks.length} Run</span>
        </div>
        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex flex-col">
          <span className="text-xs font-bold text-green-400 uppercase tracking-wider">Resolved Targets</span>
          <span className="text-3xl font-black text-green-600 mt-2">{doneTasks.length} Completed</span>
        </div>
        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex flex-col bg-red-50/50 border-red-100">
          <span className="text-xs font-bold text-red-400 uppercase tracking-wider">Overdue Alerts</span>
          <span className="text-3xl font-black text-red-600 mt-2">{overdueTasks.length} Latent</span>
        </div>
      </div>

      {/* ADMIN CONTROL FORMS */}
      {user.role === 'Admin' && (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 xl:col-span-1">
            <h3 className="font-bold text-gray-800 mb-3 text-sm tracking-wide uppercase">Initialize Project Container</h3>
            <form onSubmit={handleCreateProject} className="space-y-3">
              <input type="text" placeholder="Project Name..." className="w-full border p-2.5 text-sm rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" value={newProjectName} onChange={(e) => setNewProjectName(e.target.value)} required />
              <button type="submit" className="w-full bg-gray-900 text-white text-sm font-bold py-2.5 rounded-lg hover:bg-black transition">Build Project Module</button>
            </form>
          </div>

          <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 xl:col-span-2">
            <h3 className="font-bold text-gray-800 mb-3 text-sm tracking-wide uppercase">Deploy Structured Task</h3>
            <form onSubmit={handleCreateTask} className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <input type="text" placeholder="Task Title..." className="border p-2.5 text-sm rounded-lg outline-none focus:ring-2 focus:ring-blue-500" value={taskForm.title} onChange={(e) => setTaskForm({...taskForm, title: e.target.value})} required />
              <input type="text" placeholder="Short Functional Description..." className="border p-2.5 text-sm rounded-lg outline-none focus:ring-2 focus:ring-blue-500" value={taskForm.description} onChange={(e) => setTaskForm({...taskForm, description: e.target.value})} />
              <select className="border p-2.5 text-sm rounded-lg bg-white outline-none focus:ring-2 focus:ring-blue-500" value={taskForm.priority} onChange={(e) => setTaskForm({...taskForm, priority: e.target.value})}>
                <option value="Low">Low Priority</option>
                <option value="Medium">Medium Priority</option>
                <option value="High">High Priority</option>
              </select>
              <input type="date" className="border p-2.5 text-sm rounded-lg outline-none focus:ring-2 focus:ring-blue-500" value={taskForm.dueDate} onChange={(e) => setTaskForm({...taskForm, dueDate: e.target.value})} />
              <button type="submit" className="md:col-span-2 bg-green-600 hover:bg-green-700 text-white font-bold text-sm py-2.5 rounded-lg transition" disabled={!projects.length}>+ Commit Task Item</button>
            </form>
          </div>
        </div>
      )}

      {/* MULTI-COLUMN KANBAN CORE INTERACTIVE LAYOUT */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* TODO CARD SECTION */}
        <div className="bg-gray-100/80 p-4 rounded-xl border border-gray-200/60 min-h-[550px]">
          <h2 className="font-extrabold text-base text-gray-700 mb-4 flex items-center justify-between"><span>📌 Target List (To Do)</span> <span className="bg-gray-200 px-2 py-0.5 rounded text-xs font-bold">{todoTasks.length}</span></h2>
          {todoTasks.map(task => (
            <div key={task._id} className="bg-white p-4 rounded-xl shadow-sm mb-3 border border-gray-200/80 hover:shadow transition">
              <div className="flex justify-between items-start"><h4 className="font-bold text-gray-800 text-sm">{task.title}</h4><span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${task.priority === 'High' ? 'bg-red-100 text-red-700' : task.priority === 'Medium' ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-600'}`}>{task.priority}</span></div>
              <p className="text-xs text-gray-500 mt-1.5 leading-relaxed">{task.description || 'No contextual specifications defined.'}</p>
              {task.dueDate && <p className="text-[11px] text-gray-400 mt-2 font-medium">📅 Deadline: {new Date(task.dueDate).toLocaleDateString()}</p>}
              <button onClick={() => updateStatus(task._id, 'In Progress')} className="mt-4 text-xs bg-blue-50 text-blue-600 font-bold py-2 rounded-lg w-full text-center hover:bg-blue-100 transition">Commence Task Operations ➡️</button>
            </div>
          ))}
        </div>

        {/* IN PROGRESS CARD SECTION */}
        <div className="bg-blue-50/40 p-4 rounded-xl border border-blue-100/60 min-h-[550px]">
          <h2 className="font-extrabold text-base text-blue-800 mb-4 flex items-center justify-between"><span>⏳ Under Execution</span> <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded text-xs font-bold">{inProgressTasks.length}</span></h2>
          {inProgressTasks.map(task => (
            <div key={task._id} className="bg-white p-4 rounded-xl shadow-sm mb-3 border border-gray-200/80 hover:shadow transition">
              <div className="flex justify-between items-start"><h4 className="font-bold text-gray-800 text-sm">{task.title}</h4><span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${task.priority === 'High' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>{task.priority}</span></div>
              <p className="text-xs text-gray-500 mt-1.5 leading-relaxed">{task.description}</p>
              {task.dueDate && <p className="text-[11px] text-gray-400 mt-2 font-medium">📅 Deadline: {new Date(task.dueDate).toLocaleDateString()}</p>}
              <div className="grid grid-cols-2 gap-2 mt-4">
                <button onClick={() => updateStatus(task._id, 'Todo')} className="text-xs bg-gray-50 text-gray-600 font-bold py-1.5 rounded-lg text-center hover:bg-gray-100 transition">⬅️ Revert</button>
                <button onClick={() => updateStatus(task._id, 'Done')} className="text-xs bg-green-600 text-white font-bold py-1.5 rounded-lg text-center hover:bg-green-700 transition">Complete 🏆</button>
              </div>
            </div>
          ))}
        </div>

        {/* DONE CARD SECTION */}
        <div className="bg-green-50/30 p-4 rounded-xl border border-green-100/60 min-h-[550px]">
          <h2 className="font-extrabold text-base text-green-800 mb-4 flex items-center justify-between"><span>✅ Resolved Milestones</span> <span className="bg-green-100 text-green-800 px-2 py-0.5 rounded text-xs font-bold">{doneTasks.length}</span></h2>
          {doneTasks.map(task => (
            <div key={task._id} className="bg-white p-4 rounded-xl shadow-sm mb-3 border border-green-200/50 bg-green-50/20">
              <h4 className="font-bold text-gray-400 text-sm line-through">{task.title}</h4>
              <p className="text-xs text-gray-400 mt-1 line-through">{task.description}</p>
              <button onClick={() => updateStatus(task._id, 'In Progress')} className="mt-4 text-xs bg-gray-100 text-gray-600 font-bold py-2 rounded-lg w-full text-center hover:bg-gray-200 transition">🔄 Reopen Target Pipeline</button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}