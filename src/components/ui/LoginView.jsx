import React, { useState } from 'react';
import { User, Lock, Store, ChefHat, ArrowRight, Loader2, AlertCircle } from 'lucide-react';

export default function LoginView({ onLogin }) {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Form State
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'vendor' // Default role
  });

  // --- 1. SAFE THEME DEFINITION (Fixes the crash) ---
  // We define the theme locally so it never fails
  const theme = {
    bgMain: 'bg-stone-50',
    card: 'bg-white',
    textMain: 'text-stone-800',
    textSec: 'text-stone-500',
    inputBg: 'bg-stone-100',
    border: 'border-stone-200',
    primary: 'bg-blue-600',
    primaryHover: 'hover:bg-blue-700'
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const API_URL = "http://localhost:3000/auth";
    const endpoint = isLogin ? "/login" : "/signup";
    
    // Prepare payload (Login only needs email/pass)
    const payload = isLogin 
        ? { email: formData.email, password: formData.password }
        : formData;

    try {
        const res = await fetch(`${API_URL}${endpoint}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });

        const data = await res.json();

        if (!res.ok) {
            throw new Error(data.message || "Authentication failed");
        }

        // Success!
        if (data.token) {
            // If signup returns a token, log them in. If not, ask them to login.
            onLogin(data.user || { email: formData.email, role: formData.role }, data.token);
        } else if (!isLogin) {
            // Sometimes signup doesn't return token, just "Success"
            setIsLogin(true);
            setError("Account created! Please log in.");
        }
    } catch (err) {
        console.error("Auth Error:", err);
        setError(err.message);
    } finally {
        setLoading(false);
    }
  };

  return (
    <div className={`min-h-screen flex items-center justify-center p-4 ${theme.bgMain} ${theme.textMain}`}>
      <div className={`w-full max-w-md ${theme.card} rounded-2xl shadow-xl overflow-hidden border ${theme.border}`}>
        
        {/* HEADER */}
        <div className="p-8 text-center bg-gradient-to-br from-blue-600 to-indigo-700 text-white">
          <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4 backdrop-blur-sm">
            <Store size={32} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold">{isLogin ? "Welcome Back" : "Create Account"}</h1>
          <p className="text-blue-100 text-sm mt-2">Restaurant POS & Management System</p>
        </div>

        {/* FORM */}
        <div className="p-8">
          {error && (
            <div className="mb-6 flex items-center gap-2 p-3 rounded-lg bg-red-50 text-red-600 text-sm border border-red-100 animate-in slide-in-from-top-2">
                <AlertCircle size={16} /> {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* Name Field (Signup Only) */}
            {!isLogin && (
                <div className="space-y-1">
                    <label className="text-xs font-bold uppercase tracking-wider opacity-60">Full Name</label>
                    <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border ${theme.border} ${theme.inputBg} focus-within:ring-2 focus-within:ring-blue-500 transition-all`}>
                        <User size={18} className="opacity-40"/>
                        <input 
                            required 
                            type="text" 
                            placeholder="John Doe" 
                            className="bg-transparent outline-none w-full text-sm font-medium"
                            value={formData.name}
                            onChange={e => setFormData({...formData, name: e.target.value})}
                        />
                    </div>
                </div>
            )}

            {/* Email Field */}
            <div className="space-y-1">
                <label className="text-xs font-bold uppercase tracking-wider opacity-60">Email Address</label>
                <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border ${theme.border} ${theme.inputBg} focus-within:ring-2 focus-within:ring-blue-500 transition-all`}>
                    <User size={18} className="opacity-40"/>
                    <input 
                        required 
                        type="email" 
                        placeholder="admin@restaurant.com" 
                        className="bg-transparent outline-none w-full text-sm font-medium"
                        value={formData.email}
                        onChange={e => setFormData({...formData, email: e.target.value})}
                    />
                </div>
            </div>

            {/* Password Field */}
            <div className="space-y-1">
                <label className="text-xs font-bold uppercase tracking-wider opacity-60">Password</label>
                <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border ${theme.border} ${theme.inputBg} focus-within:ring-2 focus-within:ring-blue-500 transition-all`}>
                    <Lock size={18} className="opacity-40"/>
                    <input 
                        required 
                        type="password" 
                        placeholder="••••••••" 
                        className="bg-transparent outline-none w-full text-sm font-medium"
                        value={formData.password}
                        onChange={e => setFormData({...formData, password: e.target.value})}
                    />
                </div>
            </div>

            {/* Role Selection (Signup Only) */}
            {!isLogin && (
                <div className="space-y-1">
                     <label className="text-xs font-bold uppercase tracking-wider opacity-60">I am a...</label>
                     <div className="grid grid-cols-2 gap-3">
                        <button 
                            type="button"
                            onClick={() => setFormData({...formData, role: 'vendor'})}
                            className={`p-3 rounded-xl border text-sm font-bold flex items-center justify-center gap-2 transition-all ${formData.role === 'vendor' ? 'bg-blue-50 border-blue-500 text-blue-700' : 'border-stone-200 text-stone-500 hover:bg-stone-50'}`}
                        >
                            <Store size={16}/> Manager
                        </button>
                        <button 
                            type="button"
                            onClick={() => setFormData({...formData, role: 'kitchen'})}
                            className={`p-3 rounded-xl border text-sm font-bold flex items-center justify-center gap-2 transition-all ${formData.role === 'kitchen' ? 'bg-orange-50 border-orange-500 text-orange-700' : 'border-stone-200 text-stone-500 hover:bg-stone-50'}`}
                        >
                            <ChefHat size={16}/> Kitchen
                        </button>
                     </div>
                </div>
            )}

            <button 
                type="submit" 
                disabled={loading}
                className={`w-full py-4 mt-4 rounded-xl font-bold text-white shadow-lg shadow-blue-500/30 flex items-center justify-center gap-2 transition-transform active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed ${theme.primary} ${theme.primaryHover}`}
            >
                {loading ? <Loader2 size={20} className="animate-spin"/> : (isLogin ? "Sign In" : "Create Account")} 
                {!loading && <ArrowRight size={20}/>}
            </button>
          </form>
        </div>

        {/* FOOTER */}
        <div className="p-4 bg-stone-50 border-t border-stone-200 text-center">
            <p className="text-sm text-stone-500">
                {isLogin ? "Don't have an account?" : "Already have an account?"} 
                <button 
                    onClick={() => { setIsLogin(!isLogin); setError(''); }} 
                    className="ml-2 font-bold text-blue-600 hover:underline"
                >
                    {isLogin ? "Sign Up" : "Log In"}
                </button>
            </p>
        </div>

      </div>
    </div>
  );
}