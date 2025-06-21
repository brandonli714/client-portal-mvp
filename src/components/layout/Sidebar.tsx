// src/components/layout/Sidebar.tsx
import React from 'react';
import { Box, VStack, Heading, Link, Icon } from '@chakra-ui/react';
import { MdDashboard, MdAssessment } from 'react-icons/md';

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
          Client Portal
        </Heading>
        <VStack align="stretch" spacing={4}>
          <Link
            href="#"
            bg="whiteAlpha.400"
            p={3}
            borderRadius="md"
            fontWeight="bold"
            display="flex"
            alignItems="center"
          >
            <Icon as={MdDashboard} mr={3} w={5} h={5} />
            Dashboard
          </Link>
          <Link
            href="#"
            p={3}
            borderRadius="md"
            _hover={{ bg: 'whiteAlpha.200' }}
            display="flex"
            alignItems="center"
          >
            <Icon as={MdAssessment} mr={3} w={5} h={5} />
            Reports
          </Link>
        </VStack>
      </VStack>
    </Box>
  );
};