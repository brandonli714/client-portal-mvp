// src/pages/Forecasting.tsx
import React, { useMemo } from 'react';
import { VStack } from '@chakra-ui/react';
import { generateFinancialData } from '../utils/dataGenerator';
import { SummaryCards } from '../components/SummaryCards';
import { MonthlyChart } from '../components/MonthlyChart';
import { useForecastingAI } from '../hooks/useForecasting';
import { VarianceWaterfallChart } from '../components/VarianceWaterfallChart';
import { AssumptionsModal } from '../components/AssumptionsModal';
import { ChartableData } from '../types';
import { MonthlyFinancials } from '../MonthlyFinancials';
import { ScenarioPlanner } from '../components/ScenarioPlanner';

// This data generation will be shared, but for now, we'll keep it simple
const allData = generateFinancialData();

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

export const ForecastingPage = () => {
  // We'll use the full dataset here for forecasting purposes
  const actualData = useMemo(() => allData, []);

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
  } = useForecastingAI(actualData);

  const forecastTotals = useMemo(() => {
    if (!isPlanning || !forecastData) return null;

    return forecastData.reduce((acc, data) => {
      acc.revenue += data.revenue.total;
      acc.grossProfit += data.grossProfit;
      acc.netIncome += data.netIncome;
      return acc;
    }, { revenue: 0, grossProfit: 0, netIncome: 0, ytdRevenue: 0, ytdNetIncome: 0 });
  }, [forecastData, isPlanning]);

  const comparisonDisplayData = useMemo(() => {
    // Always show TTM actuals as the base for comparison
    const actualChartable = transformToChartable(actualData.slice(-12), 'actual');
    if (isPlanning && forecastData) {
      const forecastChartable = transformToChartable(forecastData, 'forecast');
      return [...actualChartable, ...forecastChartable];
    }
    // If not planning, the chart inside the forecast tab will just show the TTM actuals
    return actualChartable;
  }, [actualData, forecastData, isPlanning]);


  return (
    <>
      <VStack spacing={8} align="stretch">
        <ScenarioPlanner 
            onAnalyze={startAnalysis} 
            onClear={clearForecast} 
            isPlanning={isPlanning} 
        />
        {isPlanning && forecastData && forecastTotals && (
          <VStack spacing={6} align="stretch">
            <SummaryCards
              totalRevenue={forecastTotals.revenue}
              totalGrossProfit={forecastTotals.grossProfit}
              netIncome={forecastTotals.netIncome}
              ytdRevenue={0} // Not applicable
              ytdNetIncome={0} // Not applicable
              isForecast={true}
            />
            <VarianceWaterfallChart actualData={actualData.slice(-12)} forecastData={forecastData} />
            <MonthlyChart data={comparisonDisplayData} isForecast={true}/>
          </VStack>
        )}
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