// src/pages/Forecasting.tsx
import React, { useMemo } from 'react';
import { VStack, Button, Box, Heading } from '@chakra-ui/react';
import { generateFinancialData } from '../utils/dataGenerator';
import { SummaryCards } from '../components/SummaryCards';
import { MonthlyChart } from '../components/MonthlyChart';
import { useForecastingAI } from '../hooks/useForecasting';
import { VarianceWaterfallChart } from '../components/VarianceWaterfallChart';
import { AssumptionsModal } from '../components/AssumptionsModal';
import { ChartableData, DataType } from '../types';
import { MonthlyFinancials } from '../MonthlyFinancials';

// Generate the data once
const allData = generateFinancialData();

// THIS FUNCTION IS NOW CORRECTED TO MATCH THE CHARTABLEDATA TYPE
const convertToChartable = (data: MonthlyFinancials[], type: DataType): ChartableData[] => {
  return data.map(d => ({
    date: d.date,
    month: d.date.toLocaleString('default', { month: 'short' }),
    revenue: d.revenue.total,
    cogs: d.cogs.total,
    opex: d.expenses.total,
    grossProfit: d.revenue.total - d.cogs.total,
    netIncome: d.netIncome,
    type,
  }));
};

export const ForecastingPage = () => {
  const actuals = useMemo(() => allData.slice(0, 12), []);
  
  // HOOK IS NOW CORRECTLY DESTRUCTURED
  const {
    isModalOpen,
    openModal: startConversation, // <-- RENAMED HERE
    closeModal,
    isLoading,
    messages,
    activeModifications,
    assumptions,
    forecastData,
    sendMessage,
    updateAssumption,
    updateModification,
    runAndApplyForecast,
    clearForecast,
  } = useForecastingAI(actuals);

  // DATA IS NOW CONVERTED TO THE CORRECT TYPE FOR CHARTS
  const chartableActuals = useMemo(() => convertToChartable(actuals, 'actual'), [actuals]);
  const chartableForecast = useMemo(() => forecastData ? convertToChartable(forecastData, 'forecast') : null, [forecastData]);

  // The combined data for the main chart
  const combinedChartData = chartableForecast ? [...chartableActuals, ...chartableForecast] : chartableActuals;

  // Calculate totals for SummaryCards
  const summarySource = forecastData || actuals;
  const totalRevenue = summarySource.reduce((sum, d) => sum + d.revenue.total, 0);
  const totalCogs = summarySource.reduce((sum, d) => sum + d.cogs.total, 0);
  const totalNetIncome = summarySource.reduce((sum, d) => sum + d.netIncome, 0);

  return (
    <VStack spacing={6} align="stretch" p={8}>
      <Box>
        <Heading size="lg" mb={4}>AI Scenario Planner</Heading>
        {/* MODAL IS NOW OPENED WITH THE CORRECT FUNCTION */}
        <Button onClick={startConversation} colorScheme="blue">
          Create New Forecast
        </Button>
        {forecastData && (
          <Button onClick={clearForecast} colorScheme="gray" ml={4}>
            Clear Forecast
          </Button>
        )}
      </Box>
      
      {/* SUMMARY CARDS NOW RECEIVES THE CORRECT PROPS */}
      <SummaryCards
        totalRevenue={totalRevenue}
        totalGrossProfit={totalRevenue - totalCogs}
        netIncome={totalNetIncome}
        isForecast={!!forecastData}
        ytdRevenue={0} // YTD data not applicable in forecast view
        ytdNetIncome={0} // YTD data not applicable in forecast view
      />

      {/* MONTHLY CHART NOW RECEIVES THE CORRECT PROPS */}
      <MonthlyChart
        data={combinedChartData}
        isForecast={!!forecastData}
      />

      {/* WATERFALL CHART NOW RECEIVES THE CORRECT PROPS */}
      {forecastData && (
        <VarianceWaterfallChart
          actualData={actuals}
          forecastData={forecastData}
        />
      )}

      {/* SCENARIO PLANNER REMOVED AS IT IS OBSOLETE */}

      <AssumptionsModal
        isOpen={isModalOpen}
        onClose={closeModal}
        isLoading={isLoading}
        messages={messages}
        activeModifications={activeModifications}
        assumptions={assumptions}
        onSendMessage={sendMessage}
        onUpdateAssumption={updateAssumption}
        onUpdateModification={updateModification}
        onApply={runAndApplyForecast}
      />
    </VStack>
  );
};