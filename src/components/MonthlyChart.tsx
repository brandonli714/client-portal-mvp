// src/components/MonthlyChart.tsx
import React from 'react';
import { Box, Heading } from '@chakra-ui/react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { ChartableData } from '../types';

interface MonthlyChartProps {
  data: ChartableData[];
  isForecast: boolean;
}

const formatCurrencyForAxis = (value: number) => {
    if (value >= 1000) {
        return `$${(value / 1000).toFixed(0)}k`;
    }
    return `$${value}`;
}

export const MonthlyChart: React.FC<MonthlyChartProps> = ({ data, isForecast }) => {
  if (!data) return null;

  const chartData = data.reduce((acc, item) => {
    let monthData = acc.find(m => m.month === item.month);
    if (!monthData) {
      monthData = { month: item.month };
      acc.push(monthData);
    }
    if (item.type === 'actual') {
      monthData['Actual Revenue'] = item.revenue;
      monthData['Actual Gross Profit'] = item.grossProfit;
    } else {
      monthData['Forecast Revenue'] = item.revenue;
      monthData['Forecast Gross Profit'] = item.grossProfit;
    }
    return acc;
  }, [] as any[]);

  // Ensure consistent ordering
  const monthOrder = data.map(d => d.month).filter((v, i, a) => a.indexOf(v) === i);
  chartData.sort((a, b) => monthOrder.indexOf(a.month) - monthOrder.indexOf(b.month));

  return (
    <Box p={5} bg="white" borderRadius="lg" boxShadow="sm" h="400px">
        <Heading size="md" mb={4}>Monthly Performance</Heading>
        <ResponsiveContainer width="100%" height="90%">
            <BarChart data={chartData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="month" stroke="gray.500" />
                <YAxis stroke="gray.500" tickFormatter={formatCurrencyForAxis} />
                <Tooltip
                    formatter={(value: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value)}
                    cursor={{fill: 'rgba(230, 230, 230, 0.5)'}}
                />
                <Legend />
                <Bar dataKey="Actual Revenue" fill={isForecast ? "#CBD5E0" : "#4299E1"} name="Revenue" />
                <Bar dataKey="Actual Gross Profit" fill={isForecast ? "#A0AEC0" : "#48BB78"} name="Gross Profit" />
                {isForecast && <Bar dataKey="Forecast Revenue" fill="#4299E1" name="Forecast Revenue" />}
                {isForecast && <Bar dataKey="Forecast Gross Profit" fill="#48BB78" name="Forecast Gross Profit"/>}
            </BarChart>
        </ResponsiveContainer>
    </Box>
  );
};