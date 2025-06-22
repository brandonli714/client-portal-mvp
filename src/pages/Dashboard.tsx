// src/pages/Dashboard.tsx
import React, { useState, useMemo } from 'react';
import {
  Flex, Heading, Select, VStack,
  Tabs, TabList, Tab, TabPanels, TabPanel, Box,
} from '@chakra-ui/react';
import { generateFinancialData } from '../utils/dataGenerator';
import { FinancialStatementTable } from '../components/FinancialStatementTable';
import { SummaryCards } from '../components/SummaryCards';
import { MonthlyChart } from '../components/MonthlyChart';
import { ChartableData, DataType } from '../types';
import { MonthlyFinancials } from '../MonthlyFinancials';

// Generate the data once
const allData = generateFinancialData();
const availableYears = Array.from(new Set(allData.map(d => d.date.getFullYear()))).sort((a, b) => b - a);

function transformToChartable(data: MonthlyFinancials[]): ChartableData[] {
  return data.map(d => ({
    date: d.date,
    revenue: d.revenue.total,
    cogs: d.cogs.total,
    opex: d.expenses.total,
    grossProfit: d.revenue.total - d.cogs.total,
    netIncome: d.netIncome,
    type: 'actual',
    month: d.date.toLocaleString('default', { month: 'short' }) + ` '${d.date.getFullYear().toString().slice(2)}`
  }));
}

export const DashboardPage = () => {
  const [selectedYear, setSelectedYear] = useState(availableYears[0]);

  const actualDataForYear = useMemo(() => {
    return allData.filter(d => d.date.getFullYear() === selectedYear);
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

    const ytdTotals = actualDataForYear.reduce((acc, data) => {
        const month = data.date.getMonth();
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