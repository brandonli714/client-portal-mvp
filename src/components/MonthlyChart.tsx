// src/components/MonthlyChart.tsx
import React from 'react';
import { Box, Heading } from '@chakra-ui/react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { MonthlyFinancials } from '../data/financial-data';

interface MonthlyChartProps {
  actualData: MonthlyFinancials[];
  forecastData: MonthlyFinancials[] | null;
}

const formatCurrencyForAxis = (value: number) => {
    if (value >= 1000) {
        return `$${(value / 1000).toFixed(0)}k`;
    }
    return `$${value}`;
}

export const MonthlyChart: React.FC<MonthlyChartProps> = ({ actualData, forecastData }) => {
  // Guard against rendering before data is available
  if (!actualData) return null; 

  const chartData = actualData.map((d, index) => {
    const base = {
        name: d.date.toLocaleString('default', { month: 'short' }),
        'Actual Revenue': d.revenue.total,
        'Gross Profit': d.grossProfit,
    }

    if (forecastData) {
        return {
            ...base,
            'Forecast Revenue': forecastData[index].revenue.total,
            'Forecast Gross Profit': forecastData[index].grossProfit
        }
    }
    
    return base;
  });

  return (
    <Box p={5} bg="white" borderRadius="lg" boxShadow="sm" h="400px">
        <Heading size="md" mb={4}>Monthly Performance</Heading>
        <ResponsiveContainer width="100%" height="90%">
            <BarChart data={chartData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" stroke="gray.500" />
                <YAxis stroke="gray.500" tickFormatter={formatCurrencyForAxis} />
                <Tooltip 
                    formatter={(value: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value)}
                    cursor={{fill: 'rgba(230, 230, 230, 0.5)'}}
                />
                <Legend />
                <Bar dataKey="Actual Revenue" fill={forecastData ? "#CBD5E0" : "#4299E1"} />
                <Bar dataKey="Gross Profit" fill={forecastData ? "#A0AEC0" : "#48BB78"} />
                {forecastData && <Bar dataKey="Forecast Revenue" fill="#4299E1" />}
                {forecastData && <Bar dataKey="Forecast Gross Profit" fill="#48BB78" />}
            </BarChart>
        </ResponsiveContainer>
    </Box>
  );
};