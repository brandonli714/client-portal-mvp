// src/components/dashboard/SummaryCards.tsx
import React from 'react';
import { SimpleGrid, Box, Stat, StatLabel, StatNumber, StatHelpText, StatArrow } from '@chakra-ui/react';

interface SummaryCardsProps {
  totalRevenue: number;
  totalGrossProfit: number;
  netIncome: number;
}

const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
};

export const SummaryCards: React.FC<SummaryCardsProps> = ({ totalRevenue, totalGrossProfit, netIncome }) => {
  const grossMargin = totalRevenue > 0 ? (totalGrossProfit / totalRevenue) * 100 : 0;
  const netMargin = totalRevenue > 0 ? (netIncome / totalRevenue) * 100 : 0;

  return (
    <SimpleGrid columns={{ base: 1, md: 3 }} spacing={6}>
      <Stat as={Box} p={5} bg="white" borderRadius="lg" boxShadow="sm">
        <StatLabel>Total Revenue</StatLabel>
        <StatNumber fontSize="3xl">{formatCurrency(totalRevenue)}</StatNumber>
        <StatHelpText>Year to Date</StatHelpText>
      </Stat>
      <Stat as={Box} p={5} bg="white" borderRadius="lg" boxShadow="sm">
        <StatLabel>Gross Profit</StatLabel>
        <StatNumber fontSize="3xl">{formatCurrency(totalGrossProfit)}</StatNumber>
        <StatHelpText>
            {grossMargin.toFixed(1)}% Margin
        </StatHelpText>
      </Stat>
      <Stat as={Box} p={5} bg="white" borderRadius="lg" boxShadow="sm">
        <StatLabel>Net Income</StatLabel>
        <StatNumber fontSize="3xl" color={netIncome >= 0 ? 'green.500' : 'red.500'}>
            {formatCurrency(netIncome)}
        </StatNumber>
        <StatHelpText>
          <StatArrow type={netIncome >= 0 ? 'increase' : 'decrease'} />
          {netMargin.toFixed(1)}% Net Margin
        </StatHelpText>
      </Stat>
    </SimpleGrid>
  );
};