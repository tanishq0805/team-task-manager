import { Link } from 'react-router-dom';

export default function Navbar() {
  return (
    <nav className="bg-blue-600 text-white p-4 shadow-md flex justify-between items-center h-16">
      {/* Left Side: Brand Logo/Name */}
      <div className="flex items-center space-x-2">
        <span className="text-xl font-bold tracking-wider">🚀 Team Task Manager</span>
      </div>

      {/* Right Side: Navigation Links */}
      <div className="flex items-center space-x-6 font-semibold">
        <Link to="/" className="hover:text-blue-200 transition duration-200">
          Login
        </Link>
        
        {/* New Register Link added here */}
        <Link to="/register" className="bg-white text-blue-600 px-3 py-1 rounded-md hover:bg-blue-50 transition duration-200 shadow-sm">
          Register
        </Link>

        <Link to="/dashboard" className="hover:text-blue-200 transition duration-200">
          Dashboard
        </Link>
      </div>
    </nav>
  );
}