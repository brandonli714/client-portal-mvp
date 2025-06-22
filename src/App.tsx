// src/App.tsx
import { ChakraProvider, extendTheme } from '@chakra-ui/react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { DashboardLayout } from './components/layout/DashboardLayout';
import { DashboardPage } from './pages/Dashboard';
import { ForecastingPage } from './pages/Forecasting';

const theme = extendTheme({
  styles: {
    global: {
      body: {
        bg: 'gray.100', // A light gray background for the main content area
      },
    },
  },
});

export const App = () => (
  <ChakraProvider theme={theme}>
    <Router>
      <DashboardLayout>
        <Routes>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/forecasting" element={<ForecastingPage />} />
          <Route path="/reports" element={<div>Reports Page Coming Soon</div>} />
        </Routes>
      </DashboardLayout>
    </Router>
  </ChakraProvider>
);