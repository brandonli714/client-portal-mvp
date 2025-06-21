// src/pages/Dashboard.tsx
import React, { useState, useMemo } from 'react';
import {
  Flex, Heading, Select, VStack,
  Tabs, TabList, Tab, TabPanels, TabPanel,
} from '@chakra-ui/react';
import { generateFinancialData } from '../data/financial-data';
import { FinancialStatementTable } from '../components/FinancialStatementTable';
import { SummaryCards } from '../components/SummaryCards';
import { MonthlyChart } from '../components/MonthlyChart';
import { useForecastingAI } from '../hooks/useForecasting';
import { VarianceWaterfallChart } from '../components/VarianceWaterfallChart';
import { ScenarioPlanner } from '../components/ScenarioPlanner';
import { AssumptionsModal } from '../components/AssumptionsModal';

// Generate the data once
const allData = generateFinancialData();
const availableYears = Array.from(new Set(allData.map(d => d.date.getFullYear()))).sort((a, b) => b - a);

export const DashboardPage = () => {
  const [selectedYear, setSelectedYear] = useState(availableYears[0]);

  const {
    isModalOpen,
    closeModal,
    isLoading,
    startAnalysis,
    generatedModifications,
    setGeneratedModifications, // Keep this for passing to the modal
    applyForecast,
    forecastData,
    clearForecast,
    isPlanning,
  } = useForecastingAI(allData);

  const actualDataForYear = useMemo(() => {
    return allData.filter(d => d.date.getFullYear() === selectedYear);
  }, [selectedYear]);

  const forecastDataForYear = useMemo(() => {
    if (!forecastData) return null;
    return forecastData.filter(d => d.date.getFullYear() === selectedYear);
  }, [forecastData, selectedYear]);

  const totals = useMemo(() => {
    const dataToUse = forecastDataForYear || actualDataForYear;
    return dataToUse.reduce((acc, data) => {
      acc.revenue += data.revenue.total;
      acc.grossProfit += data.grossProfit;
      acc.netIncome += data.netIncome;
      return acc;
    }, { revenue: 0, grossProfit: 0, netIncome: 0 });
  }, [actualDataForYear, forecastDataForYear]);

  return (
    <VStack spacing={6} align="stretch" p={8}>
      <Flex justifyContent="space-between" alignItems="center">
        <Heading as="h2" size="xl" color="gray.700">Brandon's Tacos</Heading>
        <Select w="200px" value={selectedYear} onChange={(e) => setSelectedYear(parseInt(e.target.value, 10))} bg="white">
          {availableYears.map(year => <option key={year} value={year}>{year} Financials</option>)}
        </Select>
      </Flex>

      <ScenarioPlanner onAnalyze={startAnalysis} isPlanning={isPlanning} onClear={clearForecast} />

      <Tabs colorScheme="blue" variant="enclosed">
        <TabList>
          <Tab>Dashboard</Tab>
          <Tab>Financial Statements</Tab>
        </TabList>
        <TabPanels>
          <TabPanel p={0} pt={6}>
            <VStack spacing={6}>
              <SummaryCards totalRevenue={totals.revenue} totalGrossProfit={totals.grossProfit} netIncome={totals.netIncome} />
              {isPlanning && forecastDataForYear && (
                <VarianceWaterfallChart actualData={actualDataForYear} forecastData={forecastDataForYear} />
              )}
              <MonthlyChart actualData={actualDataForYear} forecastData={forecastDataForYear} />
            </VStack>
          </TabPanel>
          <TabPanel p={0} pt={6}>
            <FinancialStatementTable actualData={actualDataForYear} forecastData={forecastDataForYear} />
          </TabPanel>
        </TabPanels>
      </Tabs>

      <AssumptionsModal
        isOpen={isModalOpen}
        onClose={closeModal}
        isLoading={isLoading}
        assumptions={generatedModifications}
        onApply={applyForecast}
        onAssumptionChange={setGeneratedModifications}
      />
    </VStack>
  );
};