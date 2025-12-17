// App.jsx
import React, { useState, useEffect } from 'react';
import { Provider } from 'react-redux';
import store from './store/dashboardSlice';
// 💡 New imports for Firestore 'db', 'doc', 'getDoc'
import { auth, db } from './firebaseConfig'; 
import { doc, getDoc } from 'firebase/firestore'; 
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import Chatbot from './pages/Chatbot';
import History from './pages/History';

// 💡 Function to fetch the user's role from Firestore
const fetchUserRole = async (uid) => {
  try {
    const userDocRef = doc(db, "users", uid);
    const userDoc = await getDoc(userDocRef);
    if (userDoc.exists()) {
      return userDoc.data().role || 'Citizen'; // Return the stored role
    }
    // If doc doesn't exist (e.g., old user or error), default to Citizen
    return 'Citizen'; 
  } catch (error) {
    console.error("Error fetching user role:", error);
    return 'Citizen'; // Return default on error
  }
};

export default function App() {
  const [user, setUser] = useState(null);
  // 💡 New state for user role
  const [userRole, setUserRole] = useState(null); 
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        // Fetch the user's role after they are authenticated
        const role = await fetchUserRole(currentUser.uid);
        setUserRole(role);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setUserRole(null); // Clear role on logout
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

          {/* Protected routes - Pass userRole to HomePage */}
          <Route 
            path="/" 
            // 💡 Pass userRole to HomePage
            element={user ? <HomePage handleLogout={handleLogout} userRole={userRole} /> : <Navigate to="/login" />} 
          />
          <Route path="/Chatbot" element={user ? <Chatbot /> : <Navigate to="/login" />} />
          <Route path="/History" element={user ? <History /> : <Navigate to="/login" />} />
        </Routes>
      {/* </BrowserRouter> */}
    </Provider>
  );
}