import React, { useState, useEffect } from 'react';
import RestaurantVendorUI from './components/ui/RestaurantVendorUI';
import LoginView from './components/ui/LoginView';

function App() {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);

  // RESTORE SESSION ON REFRESH
  useEffect(() => {
    const savedToken = localStorage.getItem('auth_token');
    const savedUser = localStorage.getItem('auth_user');
    if (savedToken && savedUser) {
      setToken(savedToken);
      setUser(JSON.parse(savedUser));
    }
  }, []);

  const handleLogin = (userData, tokenData) => {
    localStorage.setItem('auth_token', tokenData);
    localStorage.setItem('auth_user', JSON.stringify(userData));
    setToken(tokenData);
    setUser(userData);
  };

  const handleLogout = () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
    setToken(null);
    setUser(null);
  };

  if (!token) {
    return <LoginView onLogin={handleLogin} />;
  }

  return <RestaurantVendorUI user={user} onLogout={handleLogout} />;
}

export default App;