// src/pages/Dashboard.tsx
import React, { useState, useMemo } from 'react';
import {
  Flex, Heading, Select, VStack,
  Tabs, TabList, Tab, TabPanels, TabPanel, Box,
} from '@chakra-ui/react';
import { staticFinancials } from '../staticFinancials';
import { FinancialStatementTable } from '../components/FinancialStatementTable';
import { SummaryCards } from '../components/SummaryCards';
import { MonthlyChart } from '../components/MonthlyChart';
import { ChartableData } from '../types';
import { MonthlyFinancials } from '../MonthlyFinancials';

// Helper to get year from date string or Date object
function getYear(date: string | Date): number {
  if (typeof date === 'string') {
    return parseInt(date.split(' ')[1], 10);
  }
  return date.getFullYear();
}

// Helper to get month index (0 = Jan) from date string or Date object
function getMonthIndex(date: string | Date): number {
  if (typeof date === 'string') {
    const [monthStr] = date.split(' ');
    return [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
    ].indexOf(monthStr);
  }
  return date.getMonth();
}

// Convert all static financials to have Date objects for 'date'
const allData = staticFinancials.map(entry => ({
  ...entry,
  date: typeof entry.date === 'string' ? new Date(entry.date) : entry.date,
}));

const availableYears = Array.from(new Set(allData.map(d => getYear(d.date)))).sort((a, b) => b - a);

function transformToChartable(data: MonthlyFinancials[]): ChartableData[] {
  return data.map(d => ({
    date: d.date,
    revenue: d.revenue.total,
    cogs: d.cogs.total,
    opex: d.expenses.total,
    grossProfit: d.revenue.total - d.cogs.total,
    netIncome: d.netIncome,
    type: 'actual',
    month: typeof d.date === 'string'
      ? d.date
      : d.date.toLocaleString('default', { month: 'short' }) + ` '${d.date.getFullYear().toString().slice(2)}`
  }));
}

export const DashboardPage = () => {
  const [selectedYear, setSelectedYear] = useState(availableYears[0]);

  const actualDataForYear = useMemo(() => {
    return allData.filter(d => getYear(d.date) === selectedYear);
  }, [selectedYear]);

  const displayData = useMemo(() => {
    return transformToChartable(actualDataForYear);
  }, [actualDataForYear]);

  const totals = useMemo(() => {
    const dataToUse = actualDataForYear;
    if (!dataToUse) return { revenue: 0, grossProfit: 0, netIncome: 0, ytdRevenue: 0, ytdNetIncome: 0 };

    const currentMonthIndex = new Date().getMonth();
    const isCurrentYear = selectedYear === new Date().getFullYear();

    const annualTotals = dataToUse.reduce((acc, data) => {
      acc.revenue += data.revenue.total;
      acc.grossProfit += (data.revenue.total - data.cogs.total);
      acc.netIncome += data.netIncome;
      return acc;
    }, { revenue: 0, grossProfit: 0, netIncome: 0 });

    const ytdTotals = dataToUse.reduce((acc, data) => {
      const month = getMonthIndex(data.date);
      if (isCurrentYear && month <= currentMonthIndex) {
        acc.ytdRevenue += data.revenue.total;
        acc.ytdNetIncome += data.netIncome;
      }
      return acc;
    }, { ytdRevenue: 0, ytdNetIncome: 0 });

    return { ...annualTotals, ...ytdTotals };
  }, [actualDataForYear, selectedYear]);

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
                totalRevenue={totals.revenue}
                totalGrossProfit={totals.grossProfit}
                netIncome={totals.netIncome}
                ytdRevenue={totals.ytdRevenue}
                ytdNetIncome={totals.ytdNetIncome}
                isForecast={false}
              />
              <MonthlyChart data={displayData} isForecast={false}/>
            </VStack>
          </TabPanel>
          <TabPanel p={0} pt={6}>
            <Box overflowX="auto">
              <FinancialStatementTable data={actualDataForYear} />
            </Box>
          </TabPanel>
        </TabPanels>
      </Tabs>
    </VStack>
  );
};