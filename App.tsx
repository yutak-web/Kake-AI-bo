
import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import RegistrationPage from './pages/RegistrationPage';
import AggregationPage from './pages/AggregationPage';
import SettingsPage from './pages/SettingsPage';
import WalletDetailsPage from './pages/WalletDetailsPage';
import Layout from './components/Layout';

const App: React.FC = () => {
  return (
    <HashRouter>
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
    </HashRouter>
  );
};

export default App;
