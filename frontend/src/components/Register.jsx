import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';

export default function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('user'); 
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      const BACKEND_URL = "https://team-task-manager-production-58d4.up.railway.app"; 

      const response = await fetch(`${BACKEND_URL}/api/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, email, password, role }) 
      });

      const data = await response.json();

      if (response.ok) {
        alert("Account created successfully! Redirecting to login...");
        navigate('/'); // Cleaned routing link to match your App.jsx layout path
      } else {
        alert("Registration failed: " + data.message);
      }
    } catch (error) {
      console.error(error);
      alert("Network error during registration.");
    }
  };

  return (
    <div className="flex items-center justify-center h-[calc(100vh-64px)]">
      <form onSubmit={handleRegister} className="bg-white p-8 rounded-xl shadow-lg w-96 border border-gray-200">
        <h2 className="text-2xl mb-6 font-bold text-center text-gray-800">Create Account</h2>
        
        <div className="mb-4">
          <label className="block text-sm font-semibold text-gray-600 mb-1">Full Name</label>
          <input 
            type="text" 
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="John Doe" 
            className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500" 
            required
          />
        </div>

        <div className="mb-4">
          <label className="block text-sm font-semibold text-gray-600 mb-1">Email</label>
          <input 
            type="email" 
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="admin@test.com" 
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
        
        <button type="submit" className="w-full bg-green-600 text-white font-bold p-2 rounded hover:bg-green-700 transition duration-200">
          Register
        </button>

        <p className="mt-4 text-sm text-center text-gray-600">
          Already have an account? <Link to="/" className="text-blue-600 hover:underline">Sign In</Link>
        </p>
      </form>
    </div>
  );
}