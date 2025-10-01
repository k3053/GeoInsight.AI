import React, { useState, useEffect } from 'react';
import { Provider } from 'react-redux';
import store from './store/dashboardSlice';
import { auth } from './firebaseConfig';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import Chatbot from './pages/Chatbot';
import History from './pages/History';

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
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

  return (
    <Provider store={store}>
      {/* <BrowserRouter> */}
        <Routes>
          {/* Auth routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* Protected routes */}
          <Route path="/" element={user ? <HomePage handleLogout={handleLogout} /> : <Navigate to="/login" />} />
          <Route path="/Chatbot" element={user ? <Chatbot /> : <Navigate to="/login" />} />
          <Route path="/History" element={user ? <History /> : <Navigate to="/login" />} />
        </Routes>
      {/* </BrowserRouter> */}
    </Provider>
  );
}
