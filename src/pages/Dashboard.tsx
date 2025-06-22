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
import { ChartableData } from '../types';
import { MonthlyFinancials } from '../MonthlyFinancials';

// Generate the data once
const allData = generateFinancialData();
const availableYears = Array.from(new Set(allData.map(d => d.date.getFullYear()))).sort((a, b) => b - a);

function transformToChartable(data: MonthlyFinancials[]): ChartableData[] {
  return data.map(d => ({
    date: d.date,
    revenue: d.revenue.total,
    grossProfit: d.grossProfit,
    netIncome: d.netIncome,
    type: 'actual', // Type is always 'actual' for this chart
    month: d.date.toLocaleString('default', { month: 'short' }) + ` '${d.date.getFullYear().toString().slice(2)}`
  }));
}

export const DashboardPage = () => {
  const [selectedYear, setSelectedYear] = useState(availableYears[0]);
  
  const actualDataForYear = useMemo(() => {
    return allData.filter(d => d.date.getFullYear() === selectedYear);
  }, [selectedYear]);

  const actualTotals = useMemo(() => {
    const dataToUse = actualDataForYear;
    const currentMonthIndex = new Date().getMonth();
    const isCurrentYear = selectedYear === new Date().getFullYear();

    return dataToUse.reduce((acc, data) => {
      const month = data.date.getMonth();
      acc.revenue += data.revenue.total;
      acc.grossProfit += data.grossProfit;
      acc.netIncome += data.netIncome;
      if (isCurrentYear && month <= currentMonthIndex) {
          acc.ytdRevenue += data.revenue.total;
          acc.ytdNetIncome += data.netIncome;
      }
      return acc;
    }, { revenue: 0, grossProfit: 0, netIncome: 0, ytdRevenue: 0, ytdNetIncome: 0 });
  }, [actualDataForYear, selectedYear]);
  
  const actualDisplayData = useMemo(() => {
    return transformToChartable(actualDataForYear.slice(-12));
  }, [actualDataForYear]);

  return (
    <VStack spacing={6} align="stretch">
      <Flex justifyContent="space-between" alignItems="center">
        <Heading as="h2" size="xl" color="gray.700">Brandon's Tacos</Heading>
        <Select 
          w="200px" 
          value={selectedYear} 
          onChange={(e) => setSelectedYear(parseInt(e.target.value, 10))} 
          bg="white"
        >
          {availableYears.map(year => <option key={year} value={year}>{year} Financials</option>)}
        </Select>
      </Flex>

      <Tabs colorScheme="blue" variant="enclosed">
        <TabList>
          <Tab>Dashboard</Tab>
          <Tab>Financial Statements</Tab>
        </TabList>
        <TabPanels>
          <TabPanel p={0} pt={6}>
            <VStack spacing={6} align="stretch">
              <SummaryCards 
                totalRevenue={actualTotals.revenue} 
                totalGrossProfit={actualTotals.grossProfit} 
                netIncome={actualTotals.netIncome}
                ytdRevenue={actualTotals.ytdRevenue}
                ytdNetIncome={actualTotals.ytdNetIncome}
                isForecast={false}
              />
              <MonthlyChart data={actualDisplayData} isForecast={false} />
            </VStack>
          </TabPanel>
          <TabPanel p={0} pt={6}>
            <FinancialStatementTable data={actualDataForYear} />
          </TabPanel>
        </TabPanels>
      </Tabs>
    </VStack>
  );
};