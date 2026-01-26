import React, { useState } from 'react';
import { User, Lock, Store, ChefHat, ArrowRight, Loader2, AlertCircle, Shield } from 'lucide-react';

export default function LoginView({ onLogin }) {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'cashier' // ✅ DEFAULT ROLE (matches backend)
  });

  const API = "http://localhost:3000/auth";

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

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);

    const endpoint = isLogin ? "/login" : "/signup";

    const payload = isLogin
      ? { email: formData.email, password: formData.password }
      : formData;

    try {
      const res = await fetch(`${API}${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Request failed");
      }

      if (data.token) {
        onLogin({ email: formData.email, role: formData.role }, data.token);
      } else {
        setIsLogin(true);
        setError("Signup successful. Please login.");
      }

    } catch (err) {
      console.error(err);
      setError(err.message || "Network error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={`min-h-screen flex items-center justify-center p-4 ${theme.bgMain} ${theme.textMain}`}>
      <div className={`w-full max-w-md ${theme.card} rounded-2xl shadow-xl overflow-hidden border ${theme.border}`}>

        {/* HEADER */}
        <div className="p-8 text-center bg-gradient-to-br from-blue-600 to-indigo-700 text-white">
          <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <Store size={32} />
          </div>
          <h1 className="text-2xl font-bold">
            {isLogin ? "Login" : "Create Account"}
          </h1>
        </div>

        {/* FORM */}
        <div className="p-8 space-y-4">

          {error && (
            <div className="flex items-center gap-2 p-3 rounded bg-red-100 text-red-700 text-sm">
              <AlertCircle size={16} />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">

            {!isLogin && (
              <input
                required
                placeholder="Full Name"
                className="w-full border p-3 rounded"
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
              />
            )}

            <input
              required
              type="email"
              placeholder="Email"
              className="w-full border p-3 rounded"
              value={formData.email}
              onChange={e => setFormData({ ...formData, email: e.target.value })}
            />

            <input
              required
              type="password"
              placeholder="Password"
              className="w-full border p-3 rounded"
              value={formData.password}
              onChange={e => setFormData({ ...formData, password: e.target.value })}
            />

            {/* ROLE SELECTION ONLY DURING SIGNUP */}
            {!isLogin && (
              <div className="grid grid-cols-3 gap-2">
                {["cashier", "manager", "admin"].map(r => (
                  <button
                    type="button"
                    key={r}
                    onClick={() => setFormData({ ...formData, role: r })}
                    className={`p-2 rounded border font-bold capitalize ${
                      formData.role === r
                        ? "bg-blue-100 border-blue-500"
                        : "border-gray-200"
                    }`}
                  >
                    {r}
                  </button>
                ))}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-3 rounded font-bold"
            >
              {loading ? "Processing..." : isLogin ? "Login" : "Signup"}
            </button>
          </form>

          <div className="text-center text-sm">
            {isLogin ? "No account?" : "Already registered?"}
            <button
              className="ml-2 text-blue-600 font-bold"
              onClick={() => setIsLogin(!isLogin)}
            >
              {isLogin ? "Signup" : "Login"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}