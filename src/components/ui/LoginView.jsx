import React, { useState } from 'react';
import { User, Lock, Loader, Moon, Sun } from 'lucide-react';

export default function LoginView({ onLogin, isDarkMode, onToggleTheme }) {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({ email: '', password: '', role: 'cashier' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const API_URL = "http://localhost:3000";

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const endpoint = isLogin ? '/auth/login' : '/auth/signup';
    
    try {
      const res = await fetch(`${API_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Request failed');

      if (isLogin) {
        onLogin(data.user, data.token);
      } else {
        alert("Account created! Please log in.");
        setIsLogin(true);
      }

    } catch (err) {
      console.error("Login Error:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Dynamic Classes
  const bgClass = isDarkMode ? "bg-slate-900" : "bg-slate-100";
  const cardClass = isDarkMode ? "bg-slate-800 border-slate-700" : "bg-white border-slate-200";
  const textMain = isDarkMode ? "text-white" : "text-slate-800";
  const textSub = isDarkMode ? "text-slate-400" : "text-slate-500";
  const inputBg = isDarkMode ? "bg-slate-700 border-slate-600 text-white placeholder-slate-400" : "bg-white border-slate-100 text-slate-700";

  return (
    <div className={`min-h-screen flex items-center justify-center p-4 transition-colors duration-300 ${bgClass}`}>
      
      {/* Theme Toggle Button */}
      <button 
        onClick={onToggleTheme} 
        className={`absolute top-6 right-6 p-3 rounded-full shadow-lg transition-all ${isDarkMode ? 'bg-slate-800 text-yellow-400 hover:bg-slate-700' : 'bg-white text-slate-600 hover:bg-slate-50'}`}
      >
        {isDarkMode ? <Sun size={24} /> : <Moon size={24} />}
      </button>

      <div className={`p-8 rounded-2xl shadow-xl w-full max-w-md border ${cardClass} transition-colors duration-300`}>
        <div className="text-center mb-8">
          <h1 className={`text-3xl font-black mb-2 ${textMain}`}>
            {isLogin ? 'Welcome Back' : 'Create Account'}
          </h1>
          <p className={textSub}>POS & Management System</p>
        </div>

        {error && (
          <div className="bg-red-500/10 text-red-500 p-3 rounded-lg mb-4 text-sm font-bold text-center border border-red-500/20">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className={`block text-xs font-bold uppercase mb-1 ${textSub}`}>Email</label>
            <div className="relative">
              <User className={`absolute left-3 top-3 ${textSub}`} size={20} />
              <input 
                type="email" required
                className={`w-full pl-10 pr-4 py-3 border-2 rounded-xl outline-none focus:border-blue-500 font-bold transition-colors ${inputBg}`}
                placeholder="name@example.com"
                value={formData.email}
                onChange={e => setFormData({...formData, email: e.target.value})}
              />
            </div>
          </div>

          <div>
            <label className={`block text-xs font-bold uppercase mb-1 ${textSub}`}>Password</label>
            <div className="relative">
              <Lock className={`absolute left-3 top-3 ${textSub}`} size={20} />
              <input 
                type="password" required
                className={`w-full pl-10 pr-4 py-3 border-2 rounded-xl outline-none focus:border-blue-500 font-bold transition-colors ${inputBg}`}
                placeholder="••••••••"
                value={formData.password}
                onChange={e => setFormData({...formData, password: e.target.value})}
              />
            </div>
          </div>

          {!isLogin && (
            <div>
              <label className={`block text-xs font-bold uppercase mb-1 ${textSub}`}>Role</label>
              <select 
                className={`w-full p-3 border-2 rounded-xl outline-none focus:border-blue-500 font-bold ${inputBg}`}
                value={formData.role}
                onChange={e => setFormData({...formData, role: e.target.value})}
              >
                <option value="cashier">Cashier</option>
                <option value="manager">Manager</option>
                <option value="admin">Admin</option>
              </select>
            </div>
          )}

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-blue-600 text-white py-4 rounded-xl font-bold hover:bg-blue-700 transition-all active:scale-95 disabled:opacity-50 flex justify-center items-center gap-2 shadow-lg shadow-blue-500/30"
          >
            {loading && <Loader className="animate-spin" size={20}/>}
            {isLogin ? 'Login to Dashboard' : 'Register New User'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button 
            onClick={() => { setIsLogin(!isLogin); setError(''); }}
            className={`${textSub} font-bold text-sm hover:text-blue-500 transition-colors`}
          >
            {isLogin ? "Don't have an account? Sign Up" : "Already have an account? Login"}
          </button>
        </div>
      </div>
    </div>
  );
}