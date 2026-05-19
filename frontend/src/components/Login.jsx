import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const BACKEND_URL = "https://team-task-manager-production-58d4.up.railway.app"; 

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`${BACKEND_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }) 
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify({
          id: data.user?.id || data.user?._id,
          name: data.user?.name,
          role: data.user?.role || 'User'
        }));
        navigate('/dashboard'); 
      } else {
        alert("Authentication failed: " + (data.message || "Invalid credentials"));
      }
    } catch (error) {
      console.error("Login Error details:", error);
      alert("Something went wrong during login verification.");
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-950 text-slate-100 px-4">
      <div className="bg-slate-900/60 backdrop-blur-xl p-8 rounded-2xl shadow-2xl w-full max-w-md border border-slate-800">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-black tracking-tight text-white">Welcome Back</h2>
          <p className="text-sm text-slate-400 mt-2">Sign in to manage your engineering workflows</p>
        </div>
        
        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Corporate Email</label>
            <input 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@company.com" 
              className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition" 
              required
            />
          </div>
          
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Password</label>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••" 
              className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition" 
              required
            />
          </div>
          
          <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold p-3 rounded-xl transition shadow-lg shadow-indigo-600/20 active:scale-[0.98]">
            Sign In to Workspace
          </button>
        </form>

        <p className="mt-6 text-sm text-center text-slate-400">
          New to the team? <Link to="/register" className="text-indigo-400 hover:text-indigo-300 font-medium underline underline-offset-4">Create an account</Link>
        </p>
      </div>
    </div>
  );
}