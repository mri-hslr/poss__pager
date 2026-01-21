import React, { useEffect, useState } from 'react';
import LoginView from './components/ui/LoginView';
import RestaurantVendorUI from './components/ui/RestaurantVendorUI';

function App() {
  const [user, setUser] = useState(null);

  // restore session
  useEffect(() => {
    try {
      const saved = localStorage.getItem('auth_user');
      if (!saved) return;
  
      const parsed = JSON.parse(saved);
  
      // validate shape
      if (parsed && parsed.email) {
        setUser(parsed);
      } else {
        localStorage.removeItem('auth_user');
      }
    } catch {
      localStorage.removeItem('auth_user');
    }
  }, []);
  

  const handleLogin = (user) => {
    setUser(user);
    localStorage.setItem('auth_user', JSON.stringify(user));
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('auth_user');
    localStorage.removeItem('auth_token');
  };

  const theme = {
    bgMain: 'bg-slate-950',
    bgCard: 'bg-slate-900',
    textMain: 'text-white'
  };

  if (!user) {
    return <LoginView onLogin={handleLogin} theme={theme} />;
  }

  return <RestaurantVendorUI user={user} onLogout={handleLogout} />;
}

export default App;
