// src/pages/Dashboard.tsx
import React, { useState, useMemo } from 'react';
import {
  Flex, Heading, Select, VStack,
  Tabs, TabList, Tab, TabPanels, TabPanel,
} from '@chakra-ui/react';
import { generateFinancialData } from '../utils/dataGenerator';
import { FinancialStatementTable } from '../components/FinancialStatementTable';
import { SummaryCards } from '../components/SummaryCards';
import { MonthlyChart } from '../components/MonthlyChart';
import { useForecastingAI } from '../hooks/useForecasting';
import { VarianceWaterfallChart } from '../components/VarianceWaterfallChart';
import { AssumptionsModal } from '../components/AssumptionsModal';
import { ChartableData } from '../types';
import { MonthlyFinancials } from '../MonthlyFinancials';
import { ScenarioPlanner } from '../components/ScenarioPlanner';

// Generate the data once
const allData = generateFinancialData();
const availableYears = Array.from(new Set(allData.map(d => d.date.getFullYear()))).sort((a, b) => b - a);

function transformToChartable(data: MonthlyFinancials[], type: 'actual' | 'forecast'): ChartableData[] {
  return data.map(d => ({
    date: d.date,
    revenue: d.revenue.total,
    grossProfit: d.grossProfit,
    netIncome: d.netIncome,
    type,
    month: d.date.toLocaleString('default', { month: 'short' }) + ` '${d.date.getFullYear().toString().slice(2)}`
  }));
}

export const DashboardPage = () => {
  const [selectedYear, setSelectedYear] = useState(availableYears[0]);

  const actualDataForYear = useMemo(() => {
    return allData.filter(d => d.date.getFullYear() === selectedYear);
  }, [selectedYear]);

  // The hook now only needs the base data for the selected year
  const {
    isModalOpen,
    closeModal,
    isLoading,
    startAnalysis,
    generatedModifications,
    updateModification,
    applyForecast,
    forecastData,
    clearForecast,
    isPlanning
  } = useForecastingAI(actualDataForYear);

  const forecastDataForYear = useMemo(() => {
    // The forecastData from the hook is already the complete forecast
    if (!forecastData) return null;
    return forecastData;
  }, [forecastData]);

  const displayData = useMemo(() => {
    const actualChartable = transformToChartable(actualDataForYear.slice(-12), 'actual');
    if (isPlanning && forecastDataForYear) {
      const forecastChartable = transformToChartable(forecastDataForYear, 'forecast');
      // Create a combined view for the chart
      return [...actualChartable, ...forecastChartable];
    }
    return actualChartable;
  }, [actualDataForYear, forecastDataForYear, isPlanning]);

  const financialStatementData = useMemo(() => {
      // If planning, show the TTM actuals plus the 12-month forecast
      if (isPlanning && forecastDataForYear) {
          return [...actualDataForYear.slice(-12), ...forecastDataForYear];
      }
      // Otherwise, just show the selected year's actuals
      return actualDataForYear;
  }, [actualDataForYear, forecastDataForYear, isPlanning]);

  const totals = useMemo(() => {
    const dataToUse = isPlanning && forecastDataForYear ? forecastDataForYear : actualDataForYear;
    if (!dataToUse) return { revenue: 0, grossProfit: 0, netIncome: 0, ytdRevenue: 0, ytdNetIncome: 0 };

    const currentMonthIndex = new Date().getMonth();
    const isCurrentYear = selectedYear === new Date().getFullYear();

    const annualTotals = (dataToUse as MonthlyFinancials[]).reduce((acc: { revenue: number, grossProfit: number, netIncome: number }, data) => {
        acc.revenue += data.revenue.total;
        acc.grossProfit += data.grossProfit;
        acc.netIncome += data.netIncome;
        return acc;
    }, { revenue: 0, grossProfit: 0, netIncome: 0 });


    const ytdTotals = actualDataForYear.reduce((acc, data) => {
        const month = data.date.getMonth();
        if (isCurrentYear && month <= currentMonthIndex) {
            acc.ytdRevenue += data.revenue.total;
            acc.ytdNetIncome += data.netIncome;
        }
        return acc;
    }, { ytdRevenue: 0, ytdNetIncome: 0 });

    return { ...annualTotals, ...ytdTotals };
  }, [actualDataForYear, forecastDataForYear, isPlanning, selectedYear]);

  return (
    <>
      <VStack spacing={6} align="stretch">
        <Flex justifyContent="space-between" alignItems="center">
          <Heading as="h2" size="xl" color="gray.700">Brandon's Tacos</Heading>
          <Select
            w="200px"
            value={selectedYear}
            onChange={(e) => setSelectedYear(parseInt(e.target.value, 10))}
            bg="white"
            visibility={isPlanning ? 'hidden' : 'visible'} // Hide when forecasting
          >
            {availableYears.map(year => <option key={year} value={year}>{year} Financials</option>)}
          </Select>
        </Flex>

        <Tabs colorScheme="blue" variant="enclosed">
          <TabList>
            <Tab>Dashboard</Tab>
            <Tab>Financial Statements</Tab>
            <Tab>Forecasting</Tab>
          </TabList>
          <TabPanels>
            <TabPanel p={0} pt={6}>
              <VStack spacing={6}>
                <SummaryCards
                  totalRevenue={totals.revenue}
                  totalGrossProfit={totals.grossProfit}
                  netIncome={totals.netIncome}
                  ytdRevenue={totals.ytdRevenue}
                  ytdNetIncome={totals.ytdNetIncome}
                  isForecast={isPlanning}
                />
                {isPlanning && forecastDataForYear && (
                  <VarianceWaterfallChart actualData={actualDataForYear.slice(-12)} forecastData={forecastDataForYear} />
                )}
                <MonthlyChart data={displayData} isForecast={isPlanning}/>
              </VStack>
            </TabPanel>
            <TabPanel p={0} pt={6}>
              <FinancialStatementTable data={financialStatementData} />
            </TabPanel>
            <TabPanel p={0} pt={6}>
                 <ScenarioPlanner
                    onAnalyze={startAnalysis}
                    onClear={clearForecast}
                    isPlanning={isPlanning}
                />
            </TabPanel>
          </TabPanels>
        </Tabs>
      </VStack>

      <AssumptionsModal
        isOpen={isModalOpen}
        onClose={closeModal}
        isLoading={isLoading}
        assumptions={generatedModifications}
        onApply={applyForecast}
        onAssumptionChange={updateModification}
      />
    </>
  );
};