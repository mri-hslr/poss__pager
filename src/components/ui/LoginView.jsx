import React, { useState } from 'react';
import { User, Lock, Loader, Moon, Sun, AtSign, Building2 } from 'lucide-react';
import { getTheme, COMMON_STYLES, FONTS } from './theme';

export default function LoginView({ onLogin, isDarkMode, onToggleTheme }) {
  const [isLogin, setIsLogin] = useState(true); 
  const [formData, setFormData] = useState({ restaurantId: '', username: '', email: '', password: '', role: 'cashier' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const API_URL = "http://localhost:3000";
  const theme = getTheme(isDarkMode);

  const handleSubmit = async (e) => {
    e.preventDefault(); 
    setLoading(true); 
    setError('');
    const endpoint = isLogin ? '/auth/login' : '/auth/signup';
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
      if (!res.ok) throw new Error(data.message); 
      if (isLogin) onLogin(data.user, data.token); 
      else { 
        alert("Account created!"); 
        setIsLogin(true); 
      } 
    } catch (err) { 
      setError(err.message); 
    } finally { 
      setLoading(false); 
    }
  };

  return (
    <div className={`min-h-screen flex items-center justify-center p-4 antialiased ${theme.bg.main} ${theme.text.main}`} style={{ fontFamily: FONTS.sans }}>
      <button 
        onClick={onToggleTheme} 
        className={`absolute top-6 right-6 p-3 rounded-lg ${theme.button.secondary}`}
      >
        {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
      </button>
      
      <div className={`p-8 w-full max-w-md ${COMMON_STYLES.modal(isDarkMode)}`}>
        <div className="text-center mb-8">
          <h1 className="text-2xl font-semibold mb-2">{isLogin ? 'Welcome Back' : 'Create Account'}</h1>
          <p className={`text-sm ${theme.text.secondary}`}>POS System</p>
        </div>
        
        {error && (
          <div className={`p-3 rounded-lg mb-4 text-sm font-medium text-center border ${isDarkMode ? 'bg-red-500/10 text-red-400 border-red-500/20' : 'bg-red-50 text-red-600 border-red-200'}`}>
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className={`block text-xs font-medium uppercase mb-2 ${theme.text.secondary}`}>
              Restaurant ID
            </label>
            <div className="relative group">
              <Building2 className={`absolute left-3 top-3 ${theme.text.secondary}`} size={18} />
              <input 
                required 
                className={`w-full pl-10 pr-4 py-2.5 ${COMMON_STYLES.input(isDarkMode)}`} 
                placeholder="1" 
                value={formData.restaurantId} 
                onChange={e => setFormData({...formData, restaurantId: e.target.value})} 
              />
            </div>
          </div>
          
          {!isLogin && (
            <div>
              <label className={`block text-xs font-medium uppercase mb-2 ${theme.text.secondary}`}>
                Username
              </label>
              <div className="relative group">
                <User className={`absolute left-3 top-3 ${theme.text.secondary}`} size={18} />
                <input 
                  required 
                  className={`w-full pl-10 pr-4 py-2.5 ${COMMON_STYLES.input(isDarkMode)}`} 
                  placeholder="john_doe" 
                  value={formData.username} 
                  onChange={e => setFormData({...formData, username: e.target.value})} 
                />
              </div>
            </div>
          )}
          
          <div>
            <label className={`block text-xs font-medium uppercase mb-2 ${theme.text.secondary}`}>
              Email
            </label>
            <div className="relative group">
              <AtSign className={`absolute left-3 top-3 ${theme.text.secondary}`} size={18} />
              <input 
                type="email" 
                required 
                className={`w-full pl-10 pr-4 py-2.5 ${COMMON_STYLES.input(isDarkMode)}`} 
                placeholder="name@example.com" 
                value={formData.email} 
                onChange={e => setFormData({...formData, email: e.target.value})} 
              />
            </div>
          </div>
          
          <div>
            <label className={`block text-xs font-medium uppercase mb-2 ${theme.text.secondary}`}>
              Password
            </label>
            <div className="relative group">
              <Lock className={`absolute left-3 top-3 ${theme.text.secondary}`} size={18} />
              <input 
                type="password" 
                required 
                className={`w-full pl-10 pr-4 py-2.5 ${COMMON_STYLES.input(isDarkMode)}`} 
                placeholder="••••••••" 
                value={formData.password} 
                onChange={e => setFormData({...formData, password: e.target.value})} 
              />
            </div>
          </div>
          
          {!isLogin && (
            <div>
              <label className={`block text-xs font-medium uppercase mb-2 ${theme.text.secondary}`}>
                Role
              </label>
              <select 
                className={`w-full p-2.5 ${COMMON_STYLES.select(isDarkMode)}`} 
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
            className={`w-full py-3 rounded-lg font-medium flex justify-center items-center gap-2 mt-6 ${theme.button.primary}`}
          >
            {loading && <Loader className="animate-spin" size={18} />}
            {isLogin ? 'Login' : 'Register'}
          </button>
        </form>
        
        <div className="mt-6 text-center">
          <button 
            onClick={() => { setIsLogin(!isLogin); setError(''); }} 
            className={`font-medium text-sm transition-colors ${theme.text.secondary} ${theme.bg.hover.replace('hover:', '')}`}
          >
            {isLogin ? "Sign Up" : "Login"}
          </button>
        </div>
      </div>
    </div>
  );
}