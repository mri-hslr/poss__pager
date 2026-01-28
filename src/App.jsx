import React, { useState, useEffect } from 'react';
import RestaurantVendorUI from './components/ui/RestaurantVendorUI';
import LoginView from './components/ui/LoginView'; // ✅ IMPORTED LOGIN VIEW

// ✅ DYNAMIC BACKEND CONNECTION
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

export default function App() {
  const [user, setUser] = useState(null);
  const [isDarkMode, setIsDarkMode] = useState(true);

  // 1. Check for Session on Load
  useEffect(() => {
    const token = localStorage.getItem("auth_token");
    const savedRole = localStorage.getItem("user_role");
    
    if (token) {
      console.log(`✅ Connected to Backend: ${API_URL}`);
      setUser({ role: savedRole || "cashier", token });
    }
  }, []);

  // 2. Handle Login Success (Called by LoginView)
  const handleLoginSuccess = (userData, token) => {
    const userRole = userData?.role || "cashier";
    
    // Save to LocalStorage
    localStorage.setItem("auth_token", token);
    localStorage.setItem("user_role", userRole);
    
    // Update State
    setUser({ ...userData, token });
  };

  // 3. Handle Logout
  const handleLogout = () => {
    localStorage.removeItem("auth_token");
    localStorage.removeItem("user_role");
    setUser(null);
  };

  // --- RENDER ---

  // If Logged In: Show Main POS UI
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

  // If Logged Out: Show Login View
  return (
    <LoginView 
      onLogin={handleLoginSuccess} 
      isDarkMode={isDarkMode} 
      onToggleTheme={() => setIsDarkMode(!isDarkMode)} 
    />
  );
}