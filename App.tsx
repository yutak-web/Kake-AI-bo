
import React, { useEffect, useState } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from './firebase';
import RegistrationPage from './pages/RegistrationPage';
import AggregationPage from './pages/AggregationPage';
import SettingsPage from './pages/SettingsPage';
import WalletDetailsPage from './pages/WalletDetailsPage';
import LoginPage from './pages/LoginPage';
import Layout from './components/Layout';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-xl font-bold animate-pulse">読み込み中...</div>
      </div>
    );
  }

  return (
    <HashRouter>
      {!user ? (
        <Routes>
          <Route path="*" element={<LoginPage />} />
        </Routes>
      ) : (
        <Routes>
          <Route element={<Layout />}>
            <Route path="/registration" element={<RegistrationPage />} />
            <Route path="/aggregation" element={<AggregationPage />} />
            <Route path="/wallet/:walletId" element={<WalletDetailsPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/" element={<Navigate to="/registration" replace />} />
          </Route>
          <Route path="*" element={<Navigate to="/registration" replace />} />
        </Routes>
      )}
    </HashRouter>
  );
};

export default App;
