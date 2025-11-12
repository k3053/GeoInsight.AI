// LoginPage.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  signInWithEmailAndPassword, 
  // 💡 New imports for Google Sign-In
  GoogleAuthProvider, 
  signInWithPopup 
} from 'firebase/auth';
// 💡 New imports for Firestore to check role
import { doc, getDoc, setDoc } from 'firebase/firestore'; 
import { auth, db } from '../firebaseConfig'; // Import 'auth' and 'db'

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  // Helper function to handle user role creation/fetching
  const handleUserRoleCheck = async (user) => {
    // 1. Check if user document exists in Firestore
    const userDocRef = doc(db, "users", user.uid);
    const userDoc = await getDoc(userDocRef);

    if (userDoc.exists()) {
      // Role exists, proceed
      return;
    }
    
    localStorage.setItem('user_session', user.uid);

    // 2. If it's a new user (Google login first time), create the document
    // Default role for a Google sign-up can be 'Citizen' or you could prompt them on first login
    await setDoc(userDocRef, {
      uid: user.uid,
      email: user.email,
      role: 'Citizen', // Default role for Google users on first sign-in
      createdAt: new Date(),
    });
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      // For email/password users, the role should already exist from RegisterPage.
      // We still run the check to ensure data consistency, although App.jsx also fetches it.
      await handleUserRoleCheck(userCredential.user);
      navigate('/');
    } catch (err) {
      setError('Failed to log in. Please check your credentials.');
      console.error(err);
    }
  };

  // 💡 New function for Google Sign-In
  const handleGoogleLogin = async () => {
    setError('');
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      // 💡 Crucial Step: Check/Create user role in Firestore
      await handleUserRoleCheck(user);
      
      navigate('/');
    } catch (err) {
      // Handle login errors
      console.error("Google Sign-In Error:", err);
      setError("Failed to sign in with Google. Please try again.");
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-[var(--theme-bg)]">
      <div className="w-full max-w-md p-8 space-y-6 card-floating">
        <h1 className="text-3xl font-bold text-center text-white">
          GeoInsight<span className="text-[var(--theme-primary)]">AI</span>
        </h1>
        
        {/* 💡 Google Login Button */}
        <button 
          onClick={handleGoogleLogin} 
          className="w-full py-2 px-4 rounded-md flex items-center justify-center gap-2 bg-white text-black font-semibold hover:bg-gray-200 transition-colors"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12.24 10.279v3.744h6.438a7.809 7.809 0 0 1-.365 2.155c-1.397 3.53-4.832 6.01-8.597 6.01-6.198 0-11.24-5.042-11.24-11.24s5.042-11.24 11.24-11.24c3.342 0 6.273 1.41 8.36 3.486l2.844-2.844c-3.14-3.033-7.46-4.89-11.204-4.89C5.474 1.48 0 6.953 0 13.68c0 6.727 5.474 12.2 12.24 12.2c5.96 0 10.635-4.32 11.24-10.279h-11.24z" fill="#4285F4"/>
            <path d="M11.24 22.88c-3.765 0-7.207-2.48-8.597-6.01h3.33a7.809 7.809 0 0 0 5.267 2.155v3.855z" fill="#34A853"/>
            <path d="M22.872 13.68c0-.79-.069-1.57-.215-2.316h-11.272v4.22h6.294a5.053 5.053 0 0 1-2.203 3.32v3.855c3.085-2.973 4.965-7.14 4.965-12.08z" fill="#4285F4"/>
            <path d="M3.333 9.488v3.744h3.33v-3.744h-3.33z" fill="#FBBC05"/>
            <path d="M11.24 1.48c3.744 0 7.064 1.857 9.104 4.75l-2.844 2.844c-1.482-1.393-3.398-2.254-5.26-2.254-2.84 0-5.163 1.52-6.524 3.744H2.637C4.098 3.997 7.42 1.48 11.24 1.48z" fill="#EA4335"/>
          </svg>
          Sign in with Google
        </button>

        {/* Separator */}
        <div className="flex items-center">
            <div className="flex-grow border-t border-gray-700"></div>
            <span className="flex-shrink mx-4 text-gray-500 text-sm">or</span>
            <div className="flex-grow border-t border-gray-700"></div>
        </div>

        {/* Email/Password Form */}
        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="text-sm font-bold text-gray-400 block">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-2 mt-1 text-white bg-[var(--theme-surface)] rounded-md border border-[var(--theme-border)] focus:outline-none focus:ring-2 focus:ring-[var(--theme-primary)]"
              required
            />
          </div>
          <div>
            <label className="text-sm font-bold text-gray-400 block">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-2 mt-1 text-white bg-[var(--theme-surface)] rounded-md border border-[var(--theme-border)] focus:outline-none focus:ring-2 focus:ring-[var(--theme-primary)]"
              required
            />
          </div>
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <button type="submit" className="cursor-pointer w-full btn-primary">
            Sign In
          </button>
        </form>
        <p className="text-center text-gray-400">
          Don't have an account?{' '}
          <button onClick={() => navigate('/register')} className="cursor-pointer text-[var(--theme-primary)] hover:underline">
            Sign Up
          </button>
        </p>
      </div>
    </div>
  );
};

export default LoginPage;