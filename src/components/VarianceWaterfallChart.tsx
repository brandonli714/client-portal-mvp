// src/components/VarianceWaterfallChart.tsx
import React from 'react';
import { Card, Title, Subtitle, BarChart as TremorBarChart } from "@tremor/react"; // Use Tremor for this chart
import { MonthlyFinancials } from '../data/financial-data';

interface VarianceWaterfallChartProps {
  actualData: MonthlyFinancials[];
  forecastData: MonthlyFinancials[];
}

const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
};

export const VarianceWaterfallChart: React.FC<VarianceWaterfallChartProps> = ({ actualData, forecastData }) => {
    const actualTotal = actualData.reduce((sum, month) => sum + month.netIncome, 0);
    const forecastTotal = forecastData.reduce((sum, month) => sum + month.netIncome, 0);

    const varianceData = [
        {
            name: "Actual Net Income",
            value: actualTotal,
        },
        {
            name: "Forecast Net Income",
            value: forecastTotal,
        }
    ]

    return (
        <Card>
            <Title>Net Income: Actual vs. Forecast</Title>
            <Subtitle>Visualizing the change in year-to-date net income based on the forecast scenario.</Subtitle>
            <TremorBarChart
                className="mt-6"
                data={varianceData}
                index="name"
                categories={["value"]}
                colors={["blue"]}
                valueFormatter={formatCurrency}
                yAxisWidth={60}
            />
        </Card>
    );
};