// src/components/VarianceWaterfallChart.tsx
import React from 'react';
import { Card, Title, Subtitle, BarChart as TremorBarChart } from "@tremor/react";
import { MonthlyFinancials } from '../MonthlyFinancials';

interface VarianceWaterfallChartProps {
  actualData: MonthlyFinancials[];
  forecastData: MonthlyFinancials[];
}

const formatCurrencyForChart = (value: number) => {
  return `$${new Intl.NumberFormat('en-US').format(value)}`;
}

export const VarianceWaterfallChart: React.FC<VarianceWaterfallChartProps> = ({ actualData, forecastData }) => {
  const actualTotal = actualData.reduce((sum, month) => sum + month.netIncome, 0);
  const forecastTotal = forecastData.reduce((sum, month) => sum + month.netIncome, 0);

  const difference = forecastTotal - actualTotal;

  const chartData = [
    {
      name: 'Actual TTM',
      value: actualTotal
    },
    {
      name: 'Forecast 12-Mo',
      value: forecastTotal
    }
  ];

  return (
    <Card>
      <Title>Net Income: Actual vs. Forecast</Title>
      <Subtitle>Trailing 12 Months vs. Next 12 Months</Subtitle>
      <TremorBarChart
        className="mt-6"
        data={chartData}
        index="name"
        categories={["value"]}
        colors={["blue"]}
        valueFormatter={formatCurrencyForChart}
        yAxisWidth={48}
        showLegend={false}
      />
    </Card>
  );
};