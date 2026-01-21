import React, { useState, useEffect } from 'react';
import { ChefHat, User, Lock, ArrowRight, Sun, Moon, Loader2 } from 'lucide-react';

export default function LoginView({ onLogin, onSignup }) {
  const [isLogin, setIsLogin] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  
  // Form State
  const [formData, setFormData] = useState({ name: '', email: '', password: '', role: 'cashier' });
  const [error, setError] = useState('');

  // 1. Load Theme on Mount
  useEffect(() => {
    const savedTheme = localStorage.getItem('pos_theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
      setIsDarkMode(true);
      document.documentElement.classList.add('dark');
    }
  }, []);

  // 2. Toggle Theme Handler
  const toggleTheme = () => {
    const newMode = !isDarkMode;
    setIsDarkMode(newMode);
    
    if (newMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('pos_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('pos_theme', 'light');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    // Simulate network delay for smooth UX
    setTimeout(async () => {
      try {
        if (isLogin) {
          await onLogin(formData.email, formData.password);
        } else {
          await onSignup(formData);
        }
      } catch (err) {
        setError(err.message || "Authentication failed");
      } finally {
        setIsLoading(false);
      }
    }, 800);
  };

  // Dynamic Styles based on Theme
  const theme = {
    bg: isDarkMode ? 'bg-slate-950' : 'bg-stone-50',
    card: isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-stone-200',
    text: isDarkMode ? 'text-slate-100' : 'text-stone-800',
    textSec: isDarkMode ? 'text-slate-400' : 'text-stone-500',
    input: isDarkMode ? 'bg-slate-950 border-slate-800 text-white placeholder:text-slate-600' : 'bg-stone-50 border-stone-200 text-stone-900 placeholder:text-stone-400',
  };

  return (
    <div className={`min-h-screen flex items-center justify-center p-4 transition-colors duration-300 ${theme.bg}`}>
      
      {/* --- THEME TOGGLE BUTTON --- */}
      <button 
        onClick={toggleTheme}
        className={`absolute top-6 right-6 p-3 rounded-full border transition-all ${isDarkMode ? 'bg-slate-800 border-slate-700 text-yellow-400 hover:bg-slate-700' : 'bg-white border-stone-200 text-stone-600 hover:bg-stone-100'} shadow-lg`}
      >
        {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
      </button>

      <div className={`w-full max-w-md ${theme.card} border rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300`}>
        
        {/* Header */}
        <div className={`p-8 text-center border-b ${isDarkMode ? 'border-slate-800' : 'border-stone-100'}`}>
          <div className="mx-auto w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mb-4 shadow-blue-500/20 shadow-lg rotate-3 hover:rotate-6 transition-transform">
            <ChefHat size={32} className="text-white" />
          </div>
          <h1 className={`text-2xl font-black tracking-tight ${theme.text}`}>POS System</h1>
          <p className={`mt-2 text-sm ${theme.textSec}`}>
            {isLogin ? 'Welcome back! Please login.' : 'Create an account to get started.'}
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-8 space-y-5">
          {error && (
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-600 text-sm font-medium text-center animate-pulse">
              {error}
            </div>
          )}

          {!isLogin && (
            <div className="space-y-1">
              <label className={`text-xs font-bold uppercase tracking-wider ${theme.textSec}`}>Full Name</label>
              <div className="relative">
                <User className={`absolute left-3 top-1/2 -translate-y-1/2 ${theme.textSec}`} size={18} />
                <input 
                  required 
                  className={`w-full pl-10 pr-4 py-3 rounded-xl border outline-none focus:ring-2 focus:ring-blue-500 transition-all ${theme.input}`}
                  placeholder="John Doe"
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                />
              </div>
            </div>
          )}

          <div className="space-y-1">
            <label className={`text-xs font-bold uppercase tracking-wider ${theme.textSec}`}>Email Address</label>
            <div className="relative">
              <User className={`absolute left-3 top-1/2 -translate-y-1/2 ${theme.textSec}`} size={18} />
              <input 
                required 
                type="email" 
                className={`w-full pl-10 pr-4 py-3 rounded-xl border outline-none focus:ring-2 focus:ring-blue-500 transition-all ${theme.input}`}
                placeholder="admin@pos.com"
                value={formData.email}
                onChange={e => setFormData({...formData, email: e.target.value})}
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className={`text-xs font-bold uppercase tracking-wider ${theme.textSec}`}>Password</label>
            <div className="relative">
              <Lock className={`absolute left-3 top-1/2 -translate-y-1/2 ${theme.textSec}`} size={18} />
              <input 
                required 
                type="password" 
                className={`w-full pl-10 pr-4 py-3 rounded-xl border outline-none focus:ring-2 focus:ring-blue-500 transition-all ${theme.input}`}
                placeholder="••••••••"
                value={formData.password}
                onChange={e => setFormData({...formData, password: e.target.value})}
              />
            </div>
          </div>

          <button 
            type="submit" 
            disabled={isLoading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl shadow-lg shadow-blue-500/30 flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isLoading ? <Loader2 className="animate-spin" /> : <>{isLogin ? 'Sign In' : 'Create Account'} <ArrowRight size={20}/></>}
          </button>
        </form>

        {/* Footer */}
        <div className={`p-4 text-center bg-black/5 ${theme.textSec} text-sm`}>
          {isLogin ? "Don't have an account? " : "Already have an account? "}
          <button 
            onClick={() => { setIsLogin(!isLogin); setError(''); }} 
            className="font-bold text-blue-600 hover:underline"
          >
            {isLogin ? 'Sign Up' : 'Login'}
          </button>
        </div>
      </div>
    </div>
  );
}