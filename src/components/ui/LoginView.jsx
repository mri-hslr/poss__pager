import React, { useState } from 'react';
import { Lock, ChefHat, Mail } from 'lucide-react';

const API = 'http://localhost:3000';

function parseJwt(token) {
  try {
    const base64 = token.split('.')[1];
    return JSON.parse(atob(base64));
  } catch {
    return null;
  }
}

export default function LoginView({ onLogin, theme }) {
  const [mode, setMode] = useState('login');

  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    role: 'cashier',
  });

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm(p => ({ ...p, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const url =
        mode === 'login'
          ? `${API}/auth/login`
          : `${API}/auth/signup`;

      const payload =
        mode === 'login'
          ? { email: form.email, password: form.password }
          : {
              name: form.name,
              email: form.email,
              password: form.password,
              role: form.role,
            };

      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Request failed');
      }

      if (!data.token) {
        throw new Error("No token returned from server");
      }

      // Save token
      localStorage.setItem('auth_token', data.token);

      // Decode user from JWT
      const user = parseJwt(data.token);

      if (!user) {
        throw new Error("Invalid token payload");
      }

      onLogin(user);

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`h-screen flex items-center justify-center ${theme.bgMain} ${theme.textMain}`}>
      <div className={`${theme.bgCard} p-8 rounded-2xl w-full max-w-md shadow-xl`}>

        <div className="text-center mb-6">
          <ChefHat size={48} className="mx-auto mb-3" />
          <h1 className="text-2xl font-bold">
            {mode === 'login' ? 'Login' : 'Create Account'}
          </h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <div className="text-red-500 text-sm">{error}</div>}

          {mode === 'signup' && (
            <input
              name="name"
              placeholder="Full Name"
              value={form.name}
              onChange={handleChange}
              className="w-full p-2 rounded bg-transparent border"
              required
            />
          )}

          <input
            name="email"
            type="email"
            placeholder="Email"
            value={form.email}
            onChange={handleChange}
            className="w-full p-2 rounded bg-transparent border"
            required
          />

          <input
            name="password"
            type="password"
            placeholder="Password"
            value={form.password}
            onChange={handleChange}
            className="w-full p-2 rounded bg-transparent border"
            required
          />

          {mode === 'signup' && (
            <select
              name="role"
              value={form.role}
              onChange={handleChange}
              className="w-full p-2 rounded bg-transparent border"
            >
              <option value="cashier">Cashier</option>
              <option value="manager">Manager</option>
              <option value="admin">Admin</option>
            </select>
          )}

          <button
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 rounded font-semibold"
          >
            {loading ? 'Please wait...' : mode === 'login' ? 'Login' : 'Sign Up'}
          </button>
        </form>

        <p
          onClick={() => setMode(m => m === 'login' ? 'signup' : 'login')}
          className="text-center mt-4 text-sm cursor-pointer opacity-70 hover:opacity-100"
        >
          {mode === 'login'
            ? "No account? Create one"
            : "Already registered? Login"}
        </p>
      </div>
    </div>
  );
}
