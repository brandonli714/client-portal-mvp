// src/components/layout/DashboardLayout.tsx
import React from 'react';
import { Box } from '@chakra-ui/react';
import { Sidebar } from './Sidebar';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  return (
    <Box>
      <Sidebar />
      <Box ml="240px" p="8">
        {children}
      </Box>
    </Box>
  );
};