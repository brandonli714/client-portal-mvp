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
      {/* This outer box creates the fixed margin for the sidebar */}
      <Box ml="240px" p="8">
        {/* This inner box safely centers the content with a max-width */}
        <Box maxW="1600px" mx="auto">
          {children}
        </Box>
      </Box>
    </Box>
  );
};