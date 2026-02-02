import React, { useState } from 'react';
import { User, Lock, Loader, Moon, Sun, AtSign, Building2 } from 'lucide-react';

/* --- LOCAL STYLE CONFIGURATION (To ensure no crashes) --- */
const FONTS = {
  sans: '-apple-system, "Segoe UI", "Geist Sans", sans-serif',
};

const COMMON_STYLES = {
  input: (isDarkMode) => `border px-3 py-2 rounded-md text-sm outline-none focus:border-neutral-400 transition-colors ${isDarkMode ? 'bg-black border-neutral-800 text-white placeholder:text-neutral-600' : 'bg-white border-neutral-200 text-black placeholder:text-neutral-400'}`,
  select: (isDarkMode) => `border px-3 py-2 rounded-md text-sm outline-none appearance-none focus:border-neutral-400 cursor-pointer transition-colors ${isDarkMode ? 'bg-black border-neutral-800 text-white' : 'bg-white border-neutral-200 text-black'}`,
  modal: (isDarkMode) => `rounded-2xl border shadow-2xl ${isDarkMode ? 'bg-black border-neutral-800' : 'bg-white border-neutral-200'}`,
};

const getTheme = (isDarkMode) => ({
  bg: { main: isDarkMode ? 'bg-black' : 'bg-white', hover: isDarkMode ? 'hover:bg-neutral-900' : 'hover:bg-neutral-50' },
  text: { main: isDarkMode ? 'text-white' : 'text-black', secondary: isDarkMode ? 'text-neutral-400' : 'text-neutral-600' },
  button: { 
    primary: isDarkMode ? 'bg-white text-black hover:bg-neutral-200' : 'bg-black text-white hover:bg-neutral-800', 
    secondary: isDarkMode ? 'bg-neutral-900 text-white hover:bg-neutral-800' : 'bg-neutral-100 text-black hover:bg-neutral-200' 
  },
});

/* --- MAIN COMPONENT --- */
export default function LoginView({ onLogin, isDarkMode, onToggleTheme }) {
  const [isLogin, setIsLogin] = useState(true); 
  const [formData, setFormData] = useState({ restaurantId: '', username: '', email: '', password: '', role: 'cashier' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Use the API URL environment variable or default to localhost
  const API_URL = "http://localhost:3000";
  
  const theme = getTheme(isDarkMode);

  const handleSubmit = async (e) => {
    e.preventDefault(); 
    setLoading(true); 
    setError('');

    const endpoint = isLogin ? '/auth/login' : '/auth/signup';
    
    // --- BACKEND INTEGRATION LOGIC ---
    let payload;
    if (isLogin) {
        // Login: Only needs email and password
        payload = { 
            email: formData.email, 
            password: formData.password 
        };
    } else {
        // Signup: Maps 'restaurantId' input -> 'restaurantName' for backend
        payload = {
            restaurantName: formData.restaurantId, 
            username: formData.username,
            email: formData.email,
            password: formData.password
            // Role is handled by backend (defaults to 'admin' for signup)
        };
    }
    
    try { 
      const res = await fetch(`${API_URL}${endpoint}`, { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify(payload) 
      }); 
      
      const data = await res.json(); 
      
      if (!res.ok) throw new Error(data.message || "Request failed"); 
      
      if (isLogin) {
        onLogin(data.user, data.token); 
      } else { 
        alert("Account created successfully! Please login."); 
        setIsLogin(true); 
        setFormData(prev => ({...prev, password: ''})); // Clear password
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
              {isLogin ? 'Restaurant ID (Optional)' : 'Restaurant Name'}
            </label>
            <div className="relative group">
              <Building2 className={`absolute left-3 top-3 ${theme.text.secondary}`} size={18} />
              <input 
                // Restaurant ID is not strictly needed for login in new backend, but kept for UI consistency
                required={!isLogin}
                className={`w-full pl-10 pr-4 py-2.5 ${COMMON_STYLES.input(isDarkMode)}`} 
                placeholder={isLogin ? "e.g. 1" : "My Awesome Restaurant"} 
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