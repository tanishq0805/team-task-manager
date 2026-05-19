import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';

export default function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('User'); 
  const navigate = useNavigate();

  const BACKEND_URL = "https://team-task-manager-production-58d4.up.railway.app"; 

  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`${BACKEND_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, role }) 
      });

      const data = await response.json();

      if (response.ok) {
        alert("Account created successfully! Redirecting to login...");
        navigate('/'); 
      } else {
        alert("Registration failed: " + data.message);
      }
    } catch (error) {
      console.error(error);
      alert("Network error during registration.");
    }
  };

  return (
    // Update this line right here 👇
    <div className="flex items-center justify-center min-h-screen bg-slate-950 text-slate-100 px-4">
      <div className="bg-slate-900/60 backdrop-blur-xl p-8 rounded-2xl shadow-2xl w-full max-w-md border border-slate-800">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-black tracking-tight text-white">Join Workspace</h2>
          <p className="text-sm text-slate-400 mt-2">Set up your profile credentials</p>
        </div>
        
        <form onSubmit={handleRegister} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">Full Name</label>
            <input 
              type="text" 
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="John Doe" 
              className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition" 
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">Email</label>
            <input 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@company.com" 
              className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition" 
              required
            />
          </div>
          
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">Secure Password</label>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••" 
              className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition" 
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">Account Role</label>
            <select 
              value={role} 
              onChange={(e) => setRole(e.target.value)}
              className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition font-medium"
            >
              <option value="User">Standard Member (User)</option>
              <option value="Admin">System Administrator (Admin)</option>
            </select>
          </div>
          
          <button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-semibold p-3 rounded-xl transition shadow-lg shadow-emerald-600/20 mt-2 active:scale-[0.98]">
            Complete Registration
          </button>
        </form>

        <p className="mt-6 text-sm text-center text-slate-400">
          Already registered? <Link to="/" className="text-emerald-400 hover:text-emerald-300 font-medium underline underline-offset-4">Sign In</Link>
        </p>
      </div>
    </div>
  );
}