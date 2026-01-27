import React, { useState, useEffect } from 'react';
import LoginView from './components/ui/LoginView';
import RestaurantVendorUI from './components/ui/RestaurantVendorUI';

export default function App() {
  const [user, setUser] = useState(null);
  
  // 1. Initialize Theme from Local Storage (Default to False/Light)
  const [isDarkMode, setIsDarkMode] = useState(() => {
    return localStorage.getItem('app_theme') === 'dark';
  });

  // 2. Toggle Function
  const toggleTheme = () => {
    const newMode = !isDarkMode;
    setIsDarkMode(newMode);
    localStorage.setItem('app_theme', newMode ? 'dark' : 'light');
  };

  useEffect(() => {
    const savedToken = localStorage.getItem("auth_token");
    const savedUser = localStorage.getItem("auth_user");
    if (savedToken && savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (e) {
        localStorage.clear();
      }
    }
  }, []);

  const handleLogin = (userData, token) => {
    localStorage.setItem("auth_token", token);
    localStorage.setItem("auth_user", JSON.stringify(userData));
    setUser(userData);
  };

  const handleLogout = () => {
    localStorage.removeItem("auth_token");
    localStorage.removeItem("auth_user");
    setUser(null);
    window.location.reload(); 
  };

  return (
    <div className={isDarkMode ? "dark" : ""}>
      {!user ? (
        <LoginView 
            onLogin={handleLogin} 
            isDarkMode={isDarkMode} 
            onToggleTheme={toggleTheme} 
        />
      ) : (
        <RestaurantVendorUI 
            user={user} 
            onLogout={handleLogout} 
            isDarkMode={isDarkMode} 
            onToggleTheme={toggleTheme} 
        />
      )}
    </div>
  );
}