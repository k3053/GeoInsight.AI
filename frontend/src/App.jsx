import React from 'react';
import { Provider } from 'react-redux';
import store from './store/dashboardSlice';
import Header from './components2/Header';
import HomePage from './pages/HomePage';

export default function App() {
  return (
    <Provider store={store}>
      <div className="min-h-screen bg-gradient-to-br from-[var(--geo-bg-dark)] to-[var(--geo-bg-light)] text-[var(--geo-text-light)]">
        <Header />
        <main className="animate-fadeUp">
          <HomePage />
        </main>
      </div>
    </Provider>
  );
}
