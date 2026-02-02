import React, { useState, useEffect } from 'react';
import RestaurantVendorUI from './components/ui/RestaurantVendorUI';
import LoginView from './components/ui/LoginView';

// ✅ DYNAMIC BACKEND CONNECTION
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

export default function App() {
  const [user, setUser] = useState(null);
  const [isDarkMode, setIsDarkMode] = useState(true);

  // ✅ APPLY DARK MODE TO HTML (THIS WAS MISSING)
  useEffect(() => {
    const root = document.documentElement;
    if (isDarkMode) {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
  }, [isDarkMode]);

  // 1. Check for Session on Load
  useEffect(() => {
    const token = localStorage.getItem("auth_token");
    const savedRole = localStorage.getItem("user_role");
    
    if (token) {
      console.log(`✅ Connected to Backend: ${API_URL}`);
      setUser({ role: savedRole || "cashier", token });
    }
  }, []);

  // 2. Handle Login Success
  const handleLoginSuccess = (userData, token) => {
    const userRole = userData?.role || "cashier";
    
    localStorage.setItem("auth_token", token);
    localStorage.setItem("user_role", userRole);
    
    setUser({ ...userData, token });
  };

  // 3. Handle Logout
  const handleLogout = () => {
    localStorage.removeItem("auth_token");
    localStorage.removeItem("user_role");
    setUser(null);
  };

  // --- RENDER ---

  if (user) {
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

  return (
    <LoginView 
      onLogin={handleLoginSuccess} 
      isDarkMode={isDarkMode} 
      onToggleTheme={() => setIsDarkMode(!isDarkMode)} 
    />
  );
}
