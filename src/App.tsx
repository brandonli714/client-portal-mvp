// src/App.tsx
import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { DashboardLayout } from './components/layout/DashboardLayout';
import { DashboardPage } from './pages/Dashboard';
import ForecastingPage from './pages/Forecasting';

const App: React.FC = () => {
  return (
    <Router>
      <DashboardLayout>
        <Routes>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/forecasting" element={<ForecastingPage />} />
        </Routes>
      </DashboardLayout>
    </Router>
  );
};

export default App;