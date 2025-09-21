import React, { useState, useEffect } from 'react';
import { Provider } from 'react-redux';
import store from './store/dashboardSlice';
import { auth } from './firebaseConfig';
import { onAuthStateChanged, signOut } from 'firebase/auth';

import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';

export default function App() {
  const [user, setUser] = useState(null);
  const [view, setView] = useState('login'); // 'login', 'register'
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[var(--theme-bg)] text-white">
        Loading...
      </div>
    );
  }

  // If a user is logged in, show the main application
  if (user) {
    return (
      <Provider store={store}>
        <HomePage handleLogout={handleLogout} />
      </Provider>
    );
  }

  // If no user, show login or register page
  return view === 'login' ? (
    <LoginPage setView={setView} />
  ) : (
    <RegisterPage setView={setView} />
  );
}
