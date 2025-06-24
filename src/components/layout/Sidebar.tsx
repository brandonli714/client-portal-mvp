// src/components/layout/Sidebar.tsx
import React from 'react';
import { Box, VStack, Heading, Link, Icon } from '@chakra-ui/react';
import { MdDashboard, MdAssessment, MdTimeline } from 'react-icons/md';
import { NavLink } from 'react-router-dom';

const activeLinkStyle = {
  bg: 'whiteAlpha.400',
  fontWeight: 'bold',
};

const NavItem = ({ to, icon, children }: { to: string; icon: React.ElementType; children: React.ReactNode }) => (
  <Link
    as={NavLink}
    to={to}
    p={3}
    borderRadius="md"
    display="flex"
    alignItems="center"
    _hover={{ bg: 'whiteAlpha.200' }}
    _activeLink={activeLinkStyle}
  >
    <Icon as={icon} mr={3} w={5} h={5} />
    {children}
  </Link>
);

export const Sidebar = () => {
  return (
    <Box
      as="nav"
      pos="fixed"
      top="0"
      left="0"
      h="full"
      w="240px"
      bg="gray.900"
      color="white"
      p={5}
    >
      <VStack align="stretch" spacing={8}>
        <Heading as="h1" size="md" color="whiteAlpha.900">
          Brandon's Tacos
        </Heading>
        <VStack align="stretch" spacing={4}>
          <NavItem to="/" icon={MdDashboard}>Dashboard</NavItem>
          <NavItem to="/forecasting" icon={MdTimeline}>Forecasting</NavItem>
          <NavItem to="/reports" icon={MdAssessment}>Reports</NavItem>
        </VStack>
      </VStack>
    </Box>
  );
};