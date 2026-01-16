import React from "react";
import { HashRouter, Routes, Route, Navigate } from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import RegistrationPage from "./pages/RegistrationPage";
import AggregationPage from "./pages/AggregationPage";
import SettingsPage from "./pages/SettingsPage";
import WalletDetailsPage from "./pages/WalletDetailsPage";
import Layout from "./components/Layout";

const App: React.FC = () => {
  return (
    <HashRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route element={<Layout />}>
          <Route path="/registration" element={<RegistrationPage />} />
          <Route path="/aggregation" element={<AggregationPage />} />
          <Route path="/wallet/:walletId" element={<WalletDetailsPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Route>
        <Route path="/" element={<LoginPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </HashRouter>
  );
};

export default App;
