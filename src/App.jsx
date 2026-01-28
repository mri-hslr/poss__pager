import React, { useState, useEffect } from 'react';
import RestaurantVendorUI from './components/ui/RestaurantVendorUI';
import { User, Lock, Mail, LogIn, UserPlus, AlertCircle } from 'lucide-react';

// ✅ DYNAMIC BACKEND CONNECTION
// 1. In Production (Vercel), it uses the "VITE_API_URL" variable you set in Settings.
// 2. In Development (Local), it falls back to "http://localhost:3000".
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

export default function App() {
  const [user, setUser] = useState(null);
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("cashier");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isDarkMode, setIsDarkMode] = useState(true);

  // 1. Check for Session (Only Auth Token stays in LocalStorage)
  useEffect(() => {
    const token = localStorage.getItem("auth_token");
    const savedRole = localStorage.getItem("user_role");
    
    // Validate connection on load
    if (token) {
      console.log(`✅ Connected to Backend: ${API_URL}`);
      setUser({ role: savedRole || "cashier", token });
    }
  }, []);

  // 2. Login Logic
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // Uses the dynamic API_URL
      const res = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.message || "Login failed");

      const userRole = data.user?.role || "cashier";
      
      // Save ONLY the keys needed to stay logged in
      localStorage.setItem("auth_token", data.token);
      localStorage.setItem("user_role", userRole);
      
      setUser({ ...data.user, token: data.token });
    } catch (err) {
      console.error("Login Error:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // 3. Signup Logic
  const handleSignup = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch(`${API_URL}/auth/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, role })
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.message || "Signup failed");

      alert("Account created successfully! Please log in.");
      setIsLoginMode(true);
    } catch (err) {
      console.error("Signup Error:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // 4. Logout
  const handleLogout = () => {
    localStorage.removeItem("auth_token");
    localStorage.removeItem("user_role");
    setUser(null);
    setEmail("");
    setPassword("");
  };

  // --- RENDER ---

  // If Logged In: Show Main UI
  if (user) {
    // We pass API_URL as a prop so the child component uses the same connection
    return (
      <RestaurantVendorUI 
        user={user} 
        onLogout={handleLogout} 
        isDarkMode={isDarkMode}
        onToggleTheme={() => setIsDarkMode(!isDarkMode)}
        API_URL={API_URL} 
      />
    );
  }

  // If Logged Out: Show Login Screen
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white p-4">
      <div className="w-full max-w-md bg-slate-800 rounded-2xl shadow-2xl overflow-hidden border border-slate-700">
        <div className="bg-slate-900/50 p-6 text-center border-b border-slate-700">
          <h1 className="text-3xl font-black text-blue-500 mb-2">POS Pager</h1>
          <p className="text-slate-400 text-sm">{isLoginMode ? "Welcome back! Please login." : "Create a new staff account."}</p>
        </div>

        <div className="p-8">
          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/50 rounded-xl flex items-center gap-3 text-red-400 text-sm font-bold animate-pulse">
              <AlertCircle size={20}/> {error}
            </div>
          )}

          <form onSubmit={isLoginMode ? handleLogin : handleSignup} className="space-y-4">
            {/* Email */}
            <div>
              <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                <input type="email" required className="w-full bg-slate-900 border border-slate-700 rounded-xl py-3 pl-10 pr-4 text-white font-bold outline-none focus:ring-2 focus:ring-blue-500" placeholder="user@pos.com" value={email} onChange={e => setEmail(e.target.value)} />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                <input type="password" required className="w-full bg-slate-900 border border-slate-700 rounded-xl py-3 pl-10 pr-4 text-white font-bold outline-none focus:ring-2 focus:ring-blue-500" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} />
              </div>
            </div>

            {/* Role (Signup Only) */}
            {!isLoginMode && (
              <div className="animate-in fade-in slide-in-from-top-2">
                <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Role</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                  <select className="w-full bg-slate-900 border border-slate-700 rounded-xl py-3 pl-10 pr-4 text-white font-bold outline-none focus:ring-2 focus:ring-blue-500 appearance-none" value={role} onChange={e => setRole(e.target.value)}>
                    <option value="cashier">Cashier</option>
                    <option value="manager">Manager</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
              </div>
            )}

            <button type="submit" disabled={loading} className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black py-4 rounded-xl shadow-lg shadow-blue-500/20 transition-all active:scale-95 flex items-center justify-center gap-2 mt-6 disabled:opacity-50">
              {loading ? <span className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></span> : (isLoginMode ? <><LogIn size={20}/> Login</> : <><UserPlus size={20}/> Create Account</>)}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button onClick={() => { setIsLoginMode(!isLoginMode); setError(""); }} className="text-sm font-bold text-slate-400 hover:text-white transition-colors">
              {isLoginMode ? "Need an account? Sign Up" : "Already have an account? Login"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}