import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebaseConfig';

const RegisterPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }
    try {
      await createUserWithEmailAndPassword(auth, email, password);
      navigate('/login');
      // Auth state change will handle navigation
    } catch (err) {
      setError('Failed to create an account. The email may already be in use.');
      console.error(err);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-[var(--theme-bg)]">
      <div className="w-full max-w-md p-8 space-y-6 card-floating">
        <h1 className="text-3xl font-bold text-center text-white">
          Create Account
        </h1>
        <form onSubmit={handleRegister} className="space-y-6">
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
          <button type="submit" className="w-full btn-primary cursor-pointer" onClick={handleRegister}>
            Sign Up
          </button>
        </form>
        <p className="text-center text-gray-400">
          Already have an account?{' '}
          <button onClick={() => navigate('/login')} className="text-[var(--theme-primary)] hover:underline cursor-pointer">
            Sign In
          </button>
        </p>
      </div>
    </div>
  );
};

export default RegisterPage;
