// src/components/dashboard/SummaryCards.tsx
import React from 'react';
import { SimpleGrid, Box, Stat, StatLabel, StatNumber, StatHelpText, StatArrow, Flex, Text } from '@chakra-ui/react';

interface SummaryCardsProps {
  totalRevenue: number;
  totalGrossProfit: number;
  netIncome: number;
  ytdRevenue: number;
  ytdNetIncome: number;
  isForecast: boolean;
}

const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
};

export const SummaryCards: React.FC<SummaryCardsProps> = ({
    totalRevenue,
    totalGrossProfit,
    netIncome,
    ytdRevenue,
    ytdNetIncome,
    isForecast
}) => {
  const grossMargin = totalRevenue > 0 ? (totalGrossProfit / totalRevenue) * 100 : 0;
  const netMargin = totalRevenue > 0 ? (netIncome / totalRevenue) * 100 : 0;
  const hasYtdData = !isForecast && ytdRevenue > 0;

  return (
    <SimpleGrid columns={{ base: 1, md: 3 }} spacing={6}>
      <Stat as={Box} p={5} bg="white" borderRadius="lg" boxShadow="sm">
        <StatLabel>{isForecast ? 'Forecast Revenue' : 'Total Revenue'}</StatLabel>
        <StatNumber fontSize="3xl">{formatCurrency(totalRevenue)}</StatNumber>
        <StatHelpText>
          {hasYtdData ? `${formatCurrency(ytdRevenue)} Year to Date` : (isForecast ? '12-Month Forecast' : 'Full Year')}
        </StatHelpText>
      </Stat>
      <Stat as={Box} p={5} bg="white" borderRadius="lg" boxShadow="sm">
        <StatLabel>{isForecast ? 'Forecast Gross Profit' : 'Gross Profit'}</StatLabel>
        <StatNumber fontSize="3xl">{formatCurrency(totalGrossProfit)}</StatNumber>
        <StatHelpText>
            {grossMargin.toFixed(1)}% Margin
        </StatHelpText>
      </Stat>
      <Stat as={Box} p={5} bg="white" borderRadius="lg" boxShadow="sm">
        <StatLabel>{isForecast ? 'Forecast Net Income' : 'Net Income'}</StatLabel>
        <StatNumber fontSize="3xl" color={netIncome >= 0 ? 'green.500' : 'red.500'}>
            {formatCurrency(netIncome)}
        </StatNumber>
        <StatHelpText>
          <Flex align="center">
            <StatArrow type={netIncome >= 0 ? 'increase' : 'decrease'} />
            <Text mr={2}>{netMargin.toFixed(1)}% Net Margin</Text>
            {hasYtdData && (
              <Text>({formatCurrency(ytdNetIncome)} YTD)</Text>
            )}
          </Flex>
        </StatHelpText>
      </Stat>
    </SimpleGrid>
  );
};