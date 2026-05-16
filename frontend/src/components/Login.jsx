import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

export default function Login() {
  // 1. State to hold user input
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  // 2. Function to handle form submission
  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      // ⚠️ CRITICAL STEP: Copy the real URL from your Backend block on Railway and paste it below
      // Make sure it looks like "https://your-backend-service.up.railway.app" without a trailing slash (/)
      const BACKEND_URL = "https://team-task-manager-production-58d4.up.railway.app"; 

      const response = await fetch(`${BACKEND_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }) 
      });

      const data = await response.json();

      if (response.ok) {
        // Success! Save the keys and teleport to the dashboard
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        navigate('/dashboard'); 
      } else {
        // This pops up the EXACT error from the backend (e.g., "Invalid password")
        alert("Backend says: " + data.message);
      }
    } catch (error) {
      console.error(error);
      alert("Connection blocked! This is usually a CORS error.");
    }
  };

  return (
    <div className="flex items-center justify-center h-[calc(100vh-64px)]">
      <form onSubmit={handleLogin} className="bg-white p-8 rounded-xl shadow-lg w-96 border border-gray-200">
        <h2 className="text-2xl mb-6 font-bold text-center text-gray-800">Sign In</h2>
        
        <div className="mb-4">
          <label className="block text-sm font-semibold text-gray-600 mb-1">Email</label>
          <input 
            type="email" 
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="admin@example.com" 
            className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500" 
            required
          />
        </div>
        
        <div className="mb-6">
          <label className="block text-sm font-semibold text-gray-600 mb-1">Password</label>
          <input 
            type="password" 
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••" 
            className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500" 
            required
          />
        </div>
        
        <button type="submit" className="w-full bg-blue-600 text-white font-bold p-2 rounded hover:bg-blue-700 transition duration-200">
          Login
        </button>
      </form>
    </div>
  );
}