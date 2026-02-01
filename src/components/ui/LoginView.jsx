import React, { useState } from 'react';
import { User, Lock, Loader, Moon, Sun, AtSign, Building2 } from 'lucide-react'; // ✅ Added Building2 icon

export default function LoginView({ onLogin, isDarkMode, onToggleTheme }) {
  const [isLogin, setIsLogin] = useState(true); 
  const [formData, setFormData] = useState({
    restaurantId: '', // ✅ Added Restaurant ID to state
    username: '',
    email: '',
    password: '',
    role: 'cashier'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const endpoint = isLogin ? '/auth/login' : '/auth/signup';

    // ✅ Send restaurantId for BOTH Login and Signup
    const payload = isLogin
      ? { email: formData.email, password: formData.password, restaurantId: formData.restaurantId }
      : formData;

    try {
      const res = await fetch(`${API_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Request failed');

      if (isLogin) {
        onLogin(data.user, data.token);
      } else {
        alert("Account created! Please log in.");
        setIsLogin(true);
        setFormData(prev => ({ ...prev, password: '' })); 
      }

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Styles
  const bgClass = isDarkMode ? "bg-slate-900" : "bg-slate-100";
  const cardClass = isDarkMode ? "bg-slate-800 border-slate-700" : "bg-white border-slate-200";
  const textMain = isDarkMode ? "text-white" : "text-slate-800";
  const textSub = isDarkMode ? "text-slate-400" : "text-slate-500";
  const inputBg = isDarkMode
    ? "bg-slate-700 border-slate-600 text-white placeholder-slate-400"
    : "bg-white border-slate-100 text-slate-700";

  return (
    <div className={`min-h-screen flex items-center justify-center p-4 ${bgClass}`}>
      
      <button 
        onClick={onToggleTheme} 
        className={`absolute top-6 right-6 p-3 rounded-full shadow-lg transition-all ${isDarkMode ? 'bg-slate-800 text-yellow-400' : 'bg-white text-slate-600'}`}
      >
        {isDarkMode ? <Sun size={24} /> : <Moon size={24} />}
      </button>

      <div className={`p-8 rounded-2xl shadow-2xl w-full max-w-md border ${cardClass} transition-colors duration-300`}>
        <div className="text-center mb-8">
          <h1 className={`text-3xl font-black mb-2 ${textMain}`}>
            {isLogin ? 'Welcome Back' : 'Create Account'}
          </h1>
          <p className={textSub}>POS & Management System</p>
        </div>

        {error && (
          <div className="bg-red-500/10 text-red-500 p-3 rounded-lg mb-4 text-sm font-bold text-center border border-red-500/20 animate-in fade-in zoom-in-95">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">

          {/* ✅ RESTAURANT ID FIELD (Visible for BOTH Login & Signup) */}
          <div>
            <label className={`block text-xs font-bold uppercase mb-1 ${textSub}`}>Restaurant ID</label>
            <div className="relative group">
              <Building2 className={`absolute left-3 top-3.5 transition-colors ${isDarkMode ? 'text-slate-400 group-focus-within:text-blue-400' : 'text-slate-400 group-focus-within:text-blue-600'}`} size={20} />
              <input 
                type="text" 
                required
                className={`w-full pl-10 pr-4 py-3 border-2 rounded-xl outline-none focus:border-blue-500 transition-all font-bold ${inputBg}`}
                placeholder="e.g. 1"
                value={formData.restaurantId}
                onChange={e => setFormData({...formData, restaurantId: e.target.value})}
              />
            </div>
          </div>

          {/* USERNAME (Signup Only) */}
          {!isLogin && (
            <div className="animate-in fade-in slide-in-from-top-2 duration-300">
              <label className={`block text-xs font-bold uppercase mb-1 ${textSub}`}>Username</label>
              <div className="relative group">
                <User className={`absolute left-3 top-3.5 transition-colors ${isDarkMode ? 'text-slate-400 group-focus-within:text-blue-400' : 'text-slate-400 group-focus-within:text-blue-600'}`} size={20} />
                <input 
                  type="text" required
                  className={`w-full pl-10 pr-4 py-3 border-2 rounded-xl outline-none focus:border-blue-500 transition-all font-bold ${inputBg}`}
                  placeholder="john_doe"
                  value={formData.username}
                  onChange={e => setFormData({...formData, username: e.target.value})}
                />
              </div>
            </div>
          )}

          {/* Email */}
          <div>
            <label className={`block text-xs font-bold uppercase mb-1 ${textSub}`}>Email</label>
            <div className="relative group">
              <AtSign className={`absolute left-3 top-3.5 transition-colors ${isDarkMode ? 'text-slate-400 group-focus-within:text-blue-400' : 'text-slate-400 group-focus-within:text-blue-600'}`} size={20} />
              <input 
                type="email" required
                className={`w-full pl-10 pr-4 py-3 border-2 rounded-xl outline-none focus:border-blue-500 transition-all font-bold ${inputBg}`}
                placeholder="name@example.com"
                value={formData.email}
                onChange={e => setFormData({...formData, email: e.target.value})}
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label className={`block text-xs font-bold uppercase mb-1 ${textSub}`}>Password</label>
            <div className="relative group">
              <Lock className={`absolute left-3 top-3.5 transition-colors ${isDarkMode ? 'text-slate-400 group-focus-within:text-blue-400' : 'text-slate-400 group-focus-within:text-blue-600'}`} size={20} />
              <input 
                type="password" required
                className={`w-full pl-10 pr-4 py-3 border-2 rounded-xl outline-none focus:border-blue-500 transition-all font-bold ${inputBg}`}
                placeholder="••••••••"
                value={formData.password}
                onChange={e => setFormData({...formData, password: e.target.value})}
              />
            </div>
          </div>

          {/* ROLE (Signup Only) */}
          {!isLogin && (
            <div className="animate-in fade-in slide-in-from-top-2 duration-300">
              <label className={`block text-xs font-bold uppercase mb-1 ${textSub}`}>Role</label>
              <select 
                className={`w-full p-3 border-2 rounded-xl font-bold outline-none focus:border-blue-500 transition-all ${inputBg}`}
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
            className="w-full bg-blue-600 text-white py-4 rounded-xl font-bold hover:bg-blue-700 disabled:opacity-50 flex justify-center items-center gap-2 transition-transform active:scale-[0.98]"
          >
            {loading && <Loader className="animate-spin" size={20} />}
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