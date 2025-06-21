// src/App.tsx
import { ChakraProvider, extendTheme } from '@chakra-ui/react';
import { DashboardLayout } from './components/layout/DashboardLayout';
import { DashboardPage } from './pages/Dashboard';

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
    <DashboardLayout>
      <DashboardPage />
    </DashboardLayout>
  </ChakraProvider>
);