import React from 'react';
import {
  Box,
  Heading,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  SimpleGrid,
  VStack
} from '@chakra-ui/react';

const ForecastTool = () => {
  // Dummy data for demonstration
  const forecastData = {
    revenue: 500000,
    cogs: 200000,
    grossProfit: 300000,
    expenses: 150000,
    netIncome: 150000,
  };

  return (
    <VStack spacing={8} align="stretch">
      <Box>
        <Heading size="lg" mb={4}>Financial Forecast</Heading>
        <SimpleGrid columns={{ base: 1, md: 3 }} spacing={10}>
          <Stat>
            <StatLabel>Revenue</StatLabel>
            <StatNumber>${forecastData.revenue.toLocaleString()}</StatNumber>
            <StatHelpText>Jan 2024 - Dec 2024</StatHelpText>
          </Stat>
          <Stat>
            <StatLabel>Cost of Goods Sold</StatLabel>
            <StatNumber>${forecastData.cogs.toLocaleString()}</StatNumber>
          </Stat>
          <Stat>
            <StatLabel>Gross Profit</StatLabel>
            <StatNumber>${forecastData.grossProfit.toLocaleString()}</StatNumber>
          </Stat>
          <Stat>
            <StatLabel>Operating Expenses</StatLabel>
            <StatNumber>${forecastData.expenses.toLocaleString()}</StatNumber>
          </Stat>
          <Stat>
            <StatLabel>Net Income</StatLabel>
            <StatNumber>${forecastData.netIncome.toLocaleString()}</StatNumber>
          </Stat>
        </SimpleGrid>
      </Box>
    </VStack>
  );
};

export default ForecastTool; 