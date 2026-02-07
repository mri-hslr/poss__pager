import React, { useState, useEffect } from 'react';
import RestaurantVendorUI from './components/ui/RestaurantVendorUI';
import LoginView from './components/ui/LoginView';

// ✅ DYNAMIC BACKEND CONNECTION
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

export default function App() {
  // 1. Initialize State DIRECTLY from LocalStorage
  // This prevents the "flash" of login screen and ensures user data is ready immediately
  const [user, setUser] = useState(() => {
    const token = localStorage.getItem("auth_token");
    const savedUser = localStorage.getItem("pos_user");
    
    if (token && savedUser) {
      try {
        return JSON.parse(savedUser);
      } catch (e) {
        console.error("Failed to parse user data", e);
        return null;
      }
    }
    return null;
  });

  const [isDarkMode, setIsDarkMode] = useState(true);

  useEffect(() => {
    if (user) {
      console.log(`✅ Connected as: ${user.username || 'User'} (${user.role})`);
    }
  }, [user]);

  // 2. Handle Login Success
  const handleLoginSuccess = (userData, token) => {
    // Save everything needed to restore session
    localStorage.setItem("auth_token", token);
    localStorage.setItem("pos_user", JSON.stringify(userData)); // ✅ Save full user object
    localStorage.setItem("user_role", userData.role || "cashier");
    
    setUser(userData);
  };

  // 3. Handle Logout
  const handleLogout = () => {
    localStorage.removeItem("auth_token");
    localStorage.removeItem("pos_user"); // ✅ Clear full user object
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