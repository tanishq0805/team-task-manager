import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Dashboard() {
  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [usersList, setUsersList] = useState([]); 
  
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard'); 
  
  const [newProjectName, setNewProjectName] = useState('');
  const [taskForm, setTaskForm] = useState({ title: '', description: '', priority: 'Medium', dueDate: '', assignedTo: '' });
  
  const navigate = useNavigate();
  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const BACKEND_URL = "https://team-task-manager-production-58d4.up.railway.app";

  useEffect(() => {
    if (!token) { navigate('/'); return; }
    fetchData();
    pingServer();
    const pingInterval = setInterval(() => { pingServer(); }, 60000);
    return () => clearInterval(pingInterval);
  }, [navigate, token]);

  const pingServer = () => {
    fetch(`${BACKEND_URL}/api/auth/ping`, { method: 'POST', headers: { 'x-auth-token': token } }).catch(err => console.log("Ping skipped"));
  };

  const handleLogout = async () => {
    try {
      await fetch(`${BACKEND_URL}/api/auth/logout`, {
        method: 'POST',
        headers: { 'x-auth-token': token }
      });
    } catch (e) {
      console.error("Logout ping failed", e);
    }
    localStorage.clear();
    navigate('/');
  };

  const fetchData = async () => {
    try {
      const headers = { 'x-auth-token': token };
      const [tasksRes, projsRes, usersRes] = await Promise.all([
        fetch(`${BACKEND_URL}/api/tasks`, { headers }),
        fetch(`${BACKEND_URL}/api/projects`, { headers }),
        fetch(`${BACKEND_URL}/api/auth/users`, { headers })
      ]);
      setTasks(await tasksRes.json());
      setProjects(await projsRes.json());
      if (usersRes.ok) setUsersList(await usersRes.json());
    } catch (err) { console.error("Error pulling database profiles", err); }
  };

  const handleCreateProject = async (e) => {
    e.preventDefault();
    await fetch(`${BACKEND_URL}/api/projects`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-auth-token': token },
      body: JSON.stringify({ name: newProjectName, admin: user.id || user._id })
    });
    setNewProjectName('');
    alert("Project Created Successfully!");
    fetchData();
    setActiveTab('create-task'); 
  };

  const handleCreateTask = async (e) => {
    e.preventDefault();
    if (!projects || !projects.length) return alert("Please create a project first.");
    const payload = { title: taskForm.title, description: taskForm.description, priority: taskForm.priority, dueDate: taskForm.dueDate, project: projects[0]._id };
    if (taskForm.assignedTo) payload.assignedTo = taskForm.assignedTo;

    await fetch(`${BACKEND_URL}/api/tasks`, {
      method: 'POST', headers: { 'Content-Type': 'application/json', 'x-auth-token': token }, body: JSON.stringify(payload)
    });
    setTaskForm({ title: '', description: '', priority: 'Medium', dueDate: '', assignedTo: '' });
    alert("Task Assigned Successfully!");
    fetchData();
  };

  const updateStatus = async (taskId, newStatus) => {
    await fetch(`${BACKEND_URL}/api/tasks/${taskId}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json', 'x-auth-token': token }, body: JSON.stringify({ status: newStatus })
    });
    fetchData();
  };

  const deleteTask = async (taskId) => {
    const confirmDelete = window.confirm("Are you sure you want to permanently remove this task from history?");
    if (!confirmDelete) return;
    try {
      await fetch(`${BACKEND_URL}/api/tasks/${taskId}`, { method: 'DELETE', headers: { 'x-auth-token': token } });
      fetchData(); 
    } catch (err) { alert("Error deleting task."); }
  };

  const formatCycleTime = (start, end) => {
    if (!start) return null;
    const startTime = new Date(start).getTime();
    const endTime = end ? new Date(end).getTime() : new Date().getTime();
    const diffMs = endTime - startTime;
    if (diffMs < 60000) return "< 1m";
    const diffHrs = Math.floor(diffMs / 3600000);
    const diffMins = Math.floor((diffMs % 3600000) / 60000);
    return diffHrs > 0 ? `${diffHrs}h ${diffMins}m` : `${diffMins}m`;
  };

  const loggedInUserId = user.id || user._id;
  const rawTasks = Array.isArray(tasks) ? tasks : [];
  
  const userVisibleTasks = user.role === 'Admin' 
    ? rawTasks 
    : rawTasks.filter(t => t.assignedTo && (t.assignedTo._id === loggedInUserId || t.assignedTo === loggedInUserId));

  const activeBoardTasks = userVisibleTasks.filter(t => !t.isArchived);
  const archivedHistoryTasks = userVisibleTasks.filter(t => t.isArchived);

  const todoTasks = activeBoardTasks.filter(t => t.status === 'Todo' || t.status === 'todo' || t.status === 'To Do');
  const inProgressTasks = activeBoardTasks.filter(t => t.status === 'In Progress');
  const doneTasks = activeBoardTasks.filter(t => t.status === 'Done'); 
  const overdueTasks = activeBoardTasks.filter(t => t.dueDate && t.status !== 'Done' && new Date(t.dueDate) < new Date());

  const totalCount = activeBoardTasks.length || 1; 
  const todoPct = Math.round((todoTasks.length / totalCount) * 100);
  const progressPct = Math.round((inProgressTasks.length / totalCount) * 100);
  const donePct = Math.round((doneTasks.length / totalCount) * 100);
  const overduePct = Math.round((overdueTasks.length / totalCount) * 100);

  const monitoredUsers = usersList.filter(u => u.role !== 'Admin' && u.role !== 'admin');

  const teamWorkloads = monitoredUsers.map(dbUser => {
    const assignedTasks = rawTasks.filter(t => t.assignedTo && (t.assignedTo._id === dbUser._id || t.assignedTo === dbUser._id));
    
    let isOnline = false;
    if (dbUser.lastActive) isOnline = (new Date() - new Date(dbUser.lastActive)) < 120000;
    
    let todo = 0, inProgress = 0, done = 0, overdue = 0;
    
    assignedTasks.forEach(t => {
      const status = t.status?.toLowerCase() || 'todo';
      
      if (t.isArchived || status === 'done') {
        done++;
      } else if (status === 'in progress') {
        inProgress++;
      } else {
        todo++;
      }
      
      if (t.dueDate && new Date(t.dueDate) < new Date() && !t.isArchived && status !== 'done') {
        overdue++;
      }
    });

    return { name: dbUser.name, role: dbUser.role, isOnline, total: assignedTasks.length, todo, inProgress, done, overdue };
  });

  const IconMenu = () => <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"></path></svg>;
  const IconDash = () => <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"></path></svg>;
  const IconFolder = () => <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"></path></svg>;
  const IconPlus = () => <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>;
  const IconBoard = () => <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path></svg>;
  const IconUsers = () => <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path></svg>;
  const IconArchive = () => <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4"></path></svg>;
  const IconLogout = () => <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path></svg>;

  return (
    <div className="flex h-screen bg-slate-950 text-slate-100 font-sans antialiased overflow-hidden">
      
      {/* SIDEBAR NAVIGATION */}
      <div className={`bg-slate-900 border-r border-slate-800 transition-all duration-300 flex flex-col ${isSidebarOpen ? 'w-64' : 'w-0 overflow-hidden'}`}>
        <div className="p-6 border-b border-slate-800 flex flex-col h-20 justify-center min-w-[16rem]">
          <h2 className="text-xl font-black text-white tracking-tight flex items-center gap-2">
            <span className="bg-indigo-600 w-2.5 h-5 rounded-sm inline-block"></span> Team Tasks
          </h2>
        </div>
        
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto min-w-[16rem]">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3 ml-2 mt-2">Views</p>
          <button onClick={() => setActiveTab('dashboard')} className={`w-full flex items-center p-3 rounded-xl text-sm font-semibold transition ${activeTab === 'dashboard' ? 'bg-indigo-600/10 text-indigo-400' : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'}`}>
            <IconDash /> Dashboard
          </button>
          
          <button onClick={() => setActiveTab('task-management')} className={`w-full flex items-center p-3 rounded-xl text-sm font-semibold transition ${activeTab === 'task-management' ? 'bg-indigo-600/10 text-indigo-400' : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'}`}>
            <IconBoard /> Task Management
          </button>

          <button onClick={() => setActiveTab('task-history')} className={`w-full flex items-center p-3 rounded-xl text-sm font-semibold transition ${activeTab === 'task-history' ? 'bg-indigo-600/10 text-indigo-400' : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'}`}>
            <IconArchive /> Completed Log
          </button>

          {user.role === 'Admin' && (
            <>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3 ml-2 mt-8">Admin Controls</p>
              <button onClick={() => setActiveTab('team-monitor')} className={`w-full flex items-center p-3 rounded-xl text-sm font-semibold transition ${activeTab === 'team-monitor' ? 'bg-amber-600/10 text-amber-400' : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'}`}>
                <IconUsers /> Team Monitor
              </button>
              <button onClick={() => setActiveTab('init-project')} className={`w-full flex items-center p-3 rounded-xl text-sm font-semibold transition ${activeTab === 'init-project' ? 'bg-emerald-600/10 text-emerald-400' : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'}`}>
                <IconFolder /> Create Project
              </button>
              <button onClick={() => setActiveTab('create-task')} className={`w-full flex items-center p-3 rounded-xl text-sm font-semibold transition ${activeTab === 'create-task' ? 'bg-emerald-600/10 text-emerald-400' : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'}`}>
                <IconPlus /> Assign Tasks
              </button>
            </>
          )}
        </nav>
        
        <div className="p-4 border-t border-slate-800 min-w-[16rem]">
          <div className="flex items-center gap-3 p-2">
            <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-xs font-bold text-indigo-400 border border-slate-700">
              {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
            </div>
            <div>
              <p className="text-xs font-bold text-white">{user.name}</p>
              <p className="text-[10px] text-slate-500">{user.role}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col h-screen overflow-hidden relative">
        <header className="h-20 bg-slate-950/80 backdrop-blur-md border-b border-slate-800 flex items-center justify-between px-6 z-10">
          <div className="flex items-center gap-4">
            <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="text-slate-400 hover:text-white transition p-2 rounded-lg hover:bg-slate-800">
              <IconMenu />
            </button>
            <h1 className="text-lg font-bold text-slate-200 capitalize">
              {activeTab.replace('-', ' ')}
            </h1>
          </div>
          <button onClick={handleLogout} className="flex items-center bg-slate-900 hover:bg-red-950/40 text-slate-300 hover:text-red-400 font-semibold px-4 py-2 rounded-xl transition border border-slate-800 hover:border-red-900/60 text-xs">
            <IconLogout /> Log Out
          </button>
        </header>

        <main className="flex-1 overflow-y-auto p-8 bg-slate-950 relative">
          
          {/* TAB 1: DASHBOARD */}
          {activeTab === 'dashboard' && (
            <div className="max-w-6xl mx-auto animation-fade-in">
              <div className="mb-8">
                <h2 className="text-2xl font-black text-white mb-2">Dashboard</h2>
                <p className="text-slate-400 text-sm">
                  {user.role === 'Admin' ? 'Overview of all active global tasks.' : 'Overview of your active assigned tasks.'}
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
                <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 shadow-lg">
                  <div className="flex justify-between items-end mb-4">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Total Tasks (To Do)</span>
                    <span className="text-3xl font-black text-white">{todoTasks.length}</span>
                  </div>
                  <div className="w-full bg-slate-800 rounded-full h-1.5 mb-1"><div className="bg-indigo-500 h-1.5 rounded-full" style={{ width: `${todoPct}%` }}></div></div>
                </div>
                <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 shadow-lg">
                  <div className="flex justify-between items-end mb-4">
                    <span className="text-[10px] font-bold text-cyan-500 uppercase tracking-widest">In Progress</span>
                    <span className="text-3xl font-black text-cyan-400">{inProgressTasks.length}</span>
                  </div>
                  <div className="w-full bg-slate-800 rounded-full h-1.5 mb-1"><div className="bg-cyan-500 h-1.5 rounded-full" style={{ width: `${progressPct}%` }}></div></div>
                </div>
                <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 shadow-lg">
                  <div className="flex justify-between items-end mb-4">
                    <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest">Done</span>
                    <span className="text-3xl font-black text-emerald-400">{doneTasks.length}</span>
                  </div>
                  <div className="w-full bg-slate-800 rounded-full h-1.5 mb-1"><div className="bg-emerald-500 h-1.5 rounded-full" style={{ width: `${donePct}%` }}></div></div>
                </div>
                <div className="bg-slate-900 p-6 rounded-2xl border border-red-900/30 bg-red-950/10 shadow-lg">
                  <div className="flex justify-between items-end mb-4">
                    <span className="text-[10px] font-bold text-red-500 uppercase tracking-widest">Overdue</span>
                    <span className="text-3xl font-black text-red-400">{overdueTasks.length}</span>
                  </div>
                  <div className="w-full bg-slate-800 rounded-full h-1.5 mb-1"><div className="bg-red-500 h-1.5 rounded-full" style={{ width: `${overduePct}%` }}></div></div>
                </div>
              </div>
            </div>
          )}

          {/* TAB: COMPLETED LOG WITH ASSIGNED USER DATA */}
          {activeTab === 'task-history' && (
            <div className="max-w-6xl mx-auto animation-fade-in">
              <div className="mb-8 flex justify-between items-end">
                <div>
                  <h2 className="text-2xl font-black text-white mb-2">Completed Task Log</h2>
                  <p className="text-slate-400 text-sm">A permanent record of all securely archived tasks.</p>
                </div>
                <div className="text-right">
                  <p className="text-3xl font-black text-emerald-400">{archivedHistoryTasks.length}</p>
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Total Completed</p>
                </div>
              </div>

              <div className="bg-slate-900/50 rounded-3xl border border-slate-800 shadow-xl overflow-hidden">
                {archivedHistoryTasks.length === 0 ? (
                  <div className="p-8 text-center text-slate-500">No tasks have been completed yet.</div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-900/80 border-b border-slate-800 text-[10px] uppercase tracking-widest text-slate-400">
                          <th className="p-4 font-bold">Task Title</th>
                          <th className="p-4 font-bold">Assigned To</th>
                          <th className="p-4 font-bold">Priority</th>
                          <th className="p-4 font-bold">Time Taken</th>
                          <th className="p-4 font-bold">Completed On</th>
                          <th className="p-4 font-bold text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/50">
                        {archivedHistoryTasks.map(task => (
                          <tr key={task._id} className="hover:bg-slate-800/30 transition">
                            <td className="p-4">
                              <p className="text-sm font-bold text-slate-200">{task.title}</p>
                              <p className="text-xs text-slate-500 truncate max-w-xs">{task.description}</p>
                            </td>
                            <td className="p-4">
                              <p className="text-xs font-bold text-indigo-300 bg-indigo-900/20 inline-block px-2 py-1 rounded-md border border-indigo-900/50">
                                {task.assignedTo?.name || 'Unassigned'}
                              </p>
                            </td>
                            <td className="p-4">
                              <span className={`text-[10px] font-bold px-2 py-1 rounded-lg ${task.priority === 'High' ? 'bg-red-900/30 text-red-400' : task.priority === 'Medium' ? 'bg-amber-900/30 text-amber-400' : 'bg-slate-800 text-slate-300'}`}>
                                {task.priority}
                              </span>
                            </td>
                            <td className="p-4 text-xs font-semibold text-cyan-400">
                              {task.startedAt && task.completedAt ? formatCycleTime(task.startedAt, task.completedAt) : 'N/A'}
                            </td>
                            <td className="p-4 text-xs text-slate-400">
                              {task.completedAt ? new Date(task.completedAt).toLocaleDateString() : 'N/A'}
                            </td>
                            <td className="p-4 flex gap-2 justify-end">
                              <button onClick={() => updateStatus(task._id, 'In Progress')} className="px-3 py-2 text-[10px] bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-lg transition" title="Restore to active board">🔄 Revert</button>
                              
                              {/* SECURITY: Only Admins can permanently delete archived tasks */}
                              {user.role === 'Admin' && (
                                <button onClick={() => deleteTask(task._id)} className="px-3 py-2 text-[10px] bg-red-900/20 hover:bg-red-600 text-red-500 hover:text-white font-bold rounded-lg transition" title="Permanently Delete">🗑️ Delete</button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB: TEAM MONITOR */}
          {activeTab === 'team-monitor' && user.role === 'Admin' && (
             <div className="max-w-6xl mx-auto animation-fade-in">
              <div className="mb-8">
                <h2 className="text-2xl font-black text-white mb-2">Team Workload Monitor</h2>
                <p className="text-slate-400 text-sm">Track real-time operational status and total historical output for standard users.</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {teamWorkloads.map((member, index) => (
                  <div key={index} className="bg-slate-900/50 p-6 rounded-3xl border border-slate-800 shadow-xl relative overflow-hidden">
                    <div className="flex items-center gap-4 mb-6 border-b border-slate-800 pb-4">
                      <div className="w-10 h-10 rounded-full bg-amber-900/30 border border-amber-800 flex items-center justify-center text-amber-500 font-bold relative">{member.name.charAt(0).toUpperCase()}</div>
                      <div>
                        <h3 className="text-white font-bold flex items-center gap-2">{member.name}
                          <span className="flex items-center gap-1 text-[9px] uppercase tracking-widest font-black">
                            {member.isOnline ? <span className="text-emerald-400 flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span> Online</span> : <span className="text-slate-500 flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-slate-600"></span> Offline</span>}
                          </span>
                        </h3>
                        <p className="text-[10px] text-slate-500 uppercase tracking-widest mt-0.5">{member.role} • {member.total} Total Assigned</p>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center"><span className="text-xs font-semibold text-slate-400">To Do</span><span className="text-sm font-bold text-indigo-400 bg-indigo-950/40 px-3 py-1 rounded-lg border border-indigo-900/50">{member.todo}</span></div>
                      <div className="flex justify-between items-center"><span className="text-xs font-semibold text-slate-400">In Progress</span><span className="text-sm font-bold text-cyan-400 bg-cyan-950/40 px-3 py-1 rounded-lg border border-cyan-900/50">{member.inProgress}</span></div>
                      <div className="flex justify-between items-center"><span className="text-xs font-semibold text-slate-400">Total Done (Inc. Archive)</span><span className="text-sm font-bold text-emerald-400 bg-emerald-950/40 px-3 py-1 rounded-lg border border-emerald-900/50">{member.done}</span></div>
                      {member.overdue > 0 && <div className="mt-4 pt-4 border-t border-slate-800 flex justify-between items-center"><span className="text-xs font-bold text-red-500">⚠ Breached Deadlines</span><span className="text-sm font-bold text-red-400">{member.overdue}</span></div>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB: CREATE PROJECT */}
          {activeTab === 'init-project' && user.role === 'Admin' && (
            <div className="max-w-2xl mx-auto bg-slate-900/50 p-8 rounded-3xl border border-slate-800 shadow-2xl">
              <h2 className="text-2xl font-black text-white mb-2">Create Project</h2>
              <form onSubmit={handleCreateProject} className="space-y-6 mt-8">
                <div><label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Project Name</label><input type="text" placeholder="Project Name..." className="w-full bg-slate-950 border border-slate-700 p-4 rounded-xl outline-none text-white focus:ring-2 focus:ring-indigo-500" value={newProjectName} onChange={(e) => setNewProjectName(e.target.value)} required /></div>
                <button type="submit" className="w-full bg-white hover:bg-slate-200 text-slate-900 font-bold py-4 rounded-xl transition shadow-lg text-sm">Create Project</button>
              </form>
            </div>
          )}

          {/* TAB: ASSIGN TASKS */}
          {activeTab === 'create-task' && user.role === 'Admin' && (
            <div className="max-w-3xl mx-auto bg-slate-900/50 p-8 rounded-3xl border border-slate-800 shadow-2xl">
              <h2 className="text-2xl font-black text-white mb-2">Create and Assign Tasks</h2>
              <form onSubmit={handleCreateTask} className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
                <div className="md:col-span-2"><label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Title</label><input type="text" placeholder="Task Title..." className="w-full bg-slate-950 border border-slate-700 p-4 rounded-xl outline-none text-white focus:ring-2 focus:ring-indigo-500" value={taskForm.title} onChange={(e) => setTaskForm({...taskForm, title: e.target.value})} required /></div>
                <div className="md:col-span-2"><label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Description</label><textarea placeholder="Task Description..." rows="3" className="w-full bg-slate-950 border border-slate-700 p-4 rounded-xl outline-none text-white focus:ring-2 focus:ring-indigo-500 resize-none" value={taskForm.description} onChange={(e) => setTaskForm({...taskForm, description: e.target.value})} /></div>
                <div className="md:col-span-2"><label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Assign To User</label><select className="w-full bg-slate-950 border border-slate-700 p-4 rounded-xl outline-none text-slate-200 focus:ring-2 focus:ring-indigo-500" value={taskForm.assignedTo} onChange={(e) => setTaskForm({...taskForm, assignedTo: e.target.value})}><option value="">Leave Unassigned</option>{usersList.map(u => (<option key={u._id} value={u._id}>{u.name} ({u.role})</option>))}</select></div>
                <div><label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Priority</label><select className="w-full bg-slate-950 border border-slate-700 p-4 rounded-xl outline-none text-slate-200 focus:ring-2 focus:ring-indigo-500" value={taskForm.priority} onChange={(e) => setTaskForm({...taskForm, priority: e.target.value})}><option value="Low">Low</option><option value="Medium">Medium</option><option value="High">High</option></select></div>
                <div><label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Due Date</label><input type="date" className="w-full bg-slate-950 border border-slate-700 p-4 rounded-xl outline-none text-slate-200 focus:ring-2 focus:ring-indigo-500 transition [color-scheme:dark]" value={taskForm.dueDate} onChange={(e) => setTaskForm({...taskForm, dueDate: e.target.value})} /></div>
                <button type="submit" className="md:col-span-2 mt-4 bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-4 rounded-xl transition shadow-lg text-sm" disabled={!projects.length}>{projects.length ? 'Assign Task' : '⚠️ No Projects Available'}</button>
              </form>
            </div>
          )}

          {/* TAB: TASK MANAGEMENT */}
          {activeTab === 'task-management' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full pb-10">
              
              <div className="bg-slate-900/30 p-4 rounded-2xl border border-slate-800/80 flex flex-col min-h-[500px]">
                <h2 className="font-bold text-xs uppercase tracking-widest text-slate-400 mb-4 flex items-center justify-between bg-slate-900/80 p-3 rounded-xl border border-slate-800"><span>📌 To Do</span> <span className="bg-slate-800 px-2 py-0.5 rounded text-[10px] font-black">{todoTasks.length}</span></h2>
                <div className="space-y-3 flex-1 overflow-y-auto pr-1">
                  {todoTasks.length === 0 ? <p className="text-slate-600 text-xs text-center mt-4">No pending tasks.</p> : null}
                  {todoTasks.map(task => (
                    <div key={task._id} className="bg-slate-900 p-4 rounded-xl border border-slate-700/60 shadow-sm relative overflow-hidden group">
                      <div className={`absolute top-0 left-0 w-1 h-full ${task.priority === 'High' ? 'bg-red-500' : task.priority === 'Medium' ? 'bg-amber-500' : 'bg-slate-600'}`}></div>
                      <h4 className="font-bold text-white text-sm tracking-tight pl-2">{task.title}</h4>
                      <p className="text-xs text-slate-400 mt-2 pl-2 line-clamp-2">{task.description}</p>
                      {task.dueDate && <p className="text-[10px] text-slate-500 mt-3 font-semibold pl-2">📅 Due: {new Date(task.dueDate).toLocaleDateString()}</p>}
                      <button onClick={() => updateStatus(task._id, 'In Progress')} className="mt-4 ml-2 text-[11px] bg-slate-800 hover:bg-indigo-600/20 text-indigo-400 border border-slate-700 font-bold py-2 rounded-lg w-[calc(100%-8px)] transition text-center">Move to In Progress ➡️</button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-slate-900/30 p-4 rounded-2xl border border-slate-800/80 flex flex-col min-h-[500px]">
                <h2 className="font-bold text-xs uppercase tracking-widest text-cyan-400 mb-4 flex items-center justify-between bg-slate-900/80 p-3 rounded-xl border border-slate-800"><span>⏳ In Progress</span> <span className="bg-cyan-950 text-cyan-400 px-2 py-0.5 rounded text-[10px] font-black">{inProgressTasks.length}</span></h2>
                <div className="space-y-3 flex-1 overflow-y-auto pr-1">
                  {inProgressTasks.length === 0 ? <p className="text-slate-600 text-xs text-center mt-4">No active tasks.</p> : null}
                  {inProgressTasks.map(task => (
                    <div key={task._id} className="bg-slate-900 p-4 rounded-xl border border-cyan-900/30 shadow-sm relative overflow-hidden">
                      <div className="absolute top-0 left-0 w-1 h-full bg-cyan-500"></div>
                      <h4 className="font-bold text-white text-sm tracking-tight pl-2">{task.title}</h4>
                      <p className="text-xs text-slate-400 mt-2 pl-2 line-clamp-2">{task.description}</p>
                      {task.startedAt && <p className="text-[10px] text-cyan-400 mt-3 font-semibold pl-2">⏱️ Elapsed: {formatCycleTime(task.startedAt, null)}</p>}
                      <div className="grid grid-cols-2 gap-2 mt-4 pl-2">
                        <button onClick={() => updateStatus(task._id, 'Todo')} className="text-[11px] bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold py-2 rounded-lg transition">⬅️ To Do</button>
                        <button onClick={() => updateStatus(task._id, 'Done')} className="text-[11px] bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2 rounded-lg transition shadow-lg shadow-emerald-500/20">Mark Done ✓</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-slate-900/30 p-4 rounded-2xl border border-slate-800/80 flex flex-col min-h-[500px]">
                <h2 className="font-bold text-xs uppercase tracking-widest text-emerald-400 mb-4 flex items-center justify-between bg-slate-900/80 p-3 rounded-xl border border-slate-800"><span>✅ Done</span></h2>
                <div className="space-y-3 flex-1 overflow-y-auto pr-1">
                  <div className="border border-dashed border-emerald-900/30 rounded-xl p-8 flex flex-col items-center justify-center h-full opacity-60 text-center">
                      <span className="text-3xl mb-3">📁</span>
                      <p className="text-slate-400 text-xs font-semibold">Automated Storage</p>
                      <p className="text-slate-500 text-[10px] mt-2 leading-relaxed">When you mark a task as Done, it is instantly routed to your Completed Log to keep this board clean.</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}