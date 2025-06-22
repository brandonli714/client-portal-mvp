// src/pages/Forecasting.tsx
import React, { useMemo } from 'react';
import { VStack, Heading, Button, HStack } from '@chakra-ui/react';
import { useForecastingAI } from '../hooks/useForecasting';
import { AssumptionsModal } from '../components/AssumptionsModal';
import { MonthlyFinancials } from '../MonthlyFinancials';
import { generateFinancialData } from '../utils/dataGenerator';
import { MonthlyChart } from '../components/MonthlyChart';
import { SummaryCards } from '../components/SummaryCards';
import { ChartableData, DataType } from '../types';

// Generate data once
const allData = generateFinancialData();

// Helper to convert data for charting
const convertToChartable = (data: MonthlyFinancials[], type: DataType): ChartableData[] => {
  return data.map(d => ({
    date: d.date,
    month: d.date.toLocaleString('default', { month: 'short', year: '2-digit' }),
    revenue: d.revenue.total,
    cogs: d.cogs.total,
    opex: d.expenses.total,
    grossProfit: d.revenue.total - d.cogs.total,
    netIncome: d.netIncome,
    type,
  }));
};

export const ForecastingPage = () => {
  // Use the last 12 months of actual data as the base
  const actuals = useMemo(() => allData.slice(-12), []);

  const {
    isModalOpen,
    openModal,
    closeModal,
    isLoading,
    messages,
    activeModifications,
    onSendMessage,
    onUpdateModification,
    onApply,
    forecastData,
    clearForecast,
  } = useForecastingAI(actuals);

  // Chart data combines actuals and forecast if it exists
  const chartData = useMemo(() => {
    const actualChartable = convertToChartable(actuals, 'actual');
    if (forecastData) {
      const forecastChartable = convertToChartable(forecastData, 'forecast');
      return [...actualChartable, ...forecastChartable];
    }
    return actualChartable;
  }, [actuals, forecastData]);

  // Calculate totals for SummaryCards
  const summarySource = forecastData || actuals;
  const totalRevenue = summarySource.reduce((sum: number, d: MonthlyFinancials) => sum + d.revenue.total, 0);
  const totalCogs = summarySource.reduce((sum: number, d: MonthlyFinancials) => sum + d.cogs.total, 0);
  const totalNetIncome = summarySource.reduce((sum: number, d: MonthlyFinancials) => sum + d.netIncome, 0);

  return (
    <VStack spacing={6} align="stretch" p={8}>
      <HStack justifyContent="space-between">
        <Heading as="h1">Conversational Forecasting</Heading>
        <Button onClick={openModal} colorScheme="blue">
          Describe a Scenario
        </Button>
      </HStack>

      <SummaryCards
        totalRevenue={totalRevenue}
        totalGrossProfit={totalRevenue - totalCogs}
        netIncome={totalNetIncome}
        isForecast={!!forecastData}
        ytdRevenue={0}
        ytdNetIncome={0}
      />

      <MonthlyChart data={chartData} isForecast={!!forecastData} />

      {forecastData && (
        <Button onClick={clearForecast} colorScheme="gray" alignSelf="flex-start">
            Clear Forecast
        </Button>
      )}

      <AssumptionsModal
        isOpen={isModalOpen}
        onClose={closeModal}
        isLoading={isLoading}
        messages={messages}
        activeModifications={activeModifications}
        onSendMessage={onSendMessage}
        onUpdateModification={onUpdateModification}
        onApply={onApply}
      />
    </VStack>
  );
};