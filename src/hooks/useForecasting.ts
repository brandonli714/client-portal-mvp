// src/hooks/useForecasting.ts
import { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { MonthlyFinancials } from '../MonthlyFinancials';

// --- A new, richer interface for our assumptions ---
export interface InteractiveModification {
  id: string;
  // A function that creates the description based on the current value
  descriptionTemplate: (value: number) => string;
  // The AI's reasoning for its initial suggestion
  explanation: string;
  // All the data needed for the slider
  parameter: {
    value: number;
    min: number;
    max: number;
    step: number;
    unit: '%' | '$';
  };
  // The function that applies the final, user-approved value
  apply: (month: MonthlyFinancials, value: number) => MonthlyFinancials;
}

// --- A helper to format currency for descriptions ---
const formatCurrency = (value: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(value);

// --- The AI Parser, now generating interactive modifications ---
const analyzeTextForModifications = (text: string, baseData: MonthlyFinancials[]): InteractiveModification[] => {
  const modifications: InteractiveModification[] = [];
  const lowerText = text.toLowerCase();

  // --- Rule for qualitative cost savings ---
  const savingsRegex = /(?:use|find|get|source|implement|switch to)\s+(cheaper)\s+(packaging|food|beverages)/i;
  const savingsMatch = lowerText.match(savingsRegex);
  if (savingsMatch) {
    const account = savingsMatch[2];
    const assumedSavingsPercentage = 15;

    modifications.push({
      id: uuidv4(),
      descriptionTemplate: (val) => `Assuming "cheaper ${account}" results in a ${val}% reduction in that cost category.`,
      explanation: "Based on industry benchmarks for quick-service restaurants, a switch in suppliers for consumable goods often yields a 10-20% cost savings. The AI has chosen a midpoint of 15% as a reasonable starting estimate.",
      parameter: {
        value: assumedSavingsPercentage,
        min: 0,
        max: 50,
        step: 1,
        unit: '%'
      },
      apply: (month, val) => {
        if (account === 'packaging') month.cogs.packaging *= (1 - val / 100);
        if (account === 'food') month.cogs.food *= (1 - val / 100);
        if (account === 'beverages') month.cogs.beverages *= (1 - val / 100);
        return month;
      }
    });
  }

  // --- Rule for hiring ---
  const hireRegex = /(?:hire|add|bring on)\s+(\d+|a|an|one|two|three|four|five)\s+(?:more\s*)?(?:new\s*)?(?:worker|employee|cook|person|staff)/i;
  const hireMatch = lowerText.match(hireRegex);
  if (hireMatch) {
    const numberWords: Record<string, number> = { a: 1, an: 1, one: 1, two: 2, three: 3, four: 4, five: 5 };
    const quantityStr = hireMatch[1].toLowerCase();
    const quantity = numberWords[quantityStr] || parseInt(quantityStr, 10);

    if (!isNaN(quantity)) {
        const lastMonth = baseData[baseData.length - 1];
        const estimatedEmployees = Math.round(lastMonth.revenue.total / 15000);
        const averageWage = estimatedEmployees > 0 ? lastMonth.expenses.labor.wages / estimatedEmployees : 5000;
        const wageIncrease = quantity * averageWage;

        modifications.push({
          id: uuidv4(),
          descriptionTemplate: (val) => `Hiring ${quantity} employee(s) will increase monthly wage expenses by ~${formatCurrency(val)}.`,
          explanation: `The AI calculated the average monthly wage per employee from your most recent financial data to be ~${formatCurrency(averageWage)}. This estimate is based on that average.`,
          parameter: {
            value: wageIncrease,
            min: wageIncrease * 0.5,
            max: wageIncrease * 1.5,
            step: 100,
            unit: '$'
          },
          apply: (month, val) => {
            month.expenses.labor.wages += val;
            return month;
          }
        });
    }
  }

  return modifications;
};

// --- The NEW forecasting engine ---
const runForecastEngine = (baseData: MonthlyFinancials[], modifications: InteractiveModification[]): MonthlyFinancials[] => {
  const forecast: MonthlyFinancials[] = [];
  if (baseData.length === 0) return [];

  let lastMonth = JSON.parse(JSON.stringify(baseData[baseData.length - 1])) as MonthlyFinancials;

  for (let i = 1; i <= 12; i++) {
    // Create a new month based on the previous one
    let newMonth = JSON.parse(JSON.stringify(lastMonth)) as MonthlyFinancials;
    
    // Increment the date
    const newDate = new Date(lastMonth.date);
    newDate.setUTCMonth(newDate.getUTCMonth() + 1);
    newMonth.date = newDate;

    // Apply a baseline growth factor (e.g., 0.5% monthly revenue growth)
    const growthFactor = 1.005;
    newMonth.revenue.inStore *= growthFactor;
    newMonth.revenue.delivery *= growthFactor;
    newMonth.revenue.catering *= growthFactor;

    // Apply user-defined modifications from the scenario
    for (const mod of modifications) {
      newMonth = mod.apply(newMonth, mod.parameter.value);
    }

    // Recalculate all totals from the top down
    newMonth.revenue.total = newMonth.revenue.inStore + newMonth.revenue.delivery + newMonth.revenue.catering;
    newMonth.cogs.total = newMonth.cogs.food + newMonth.cogs.beverages + newMonth.cogs.packaging;
    newMonth.grossProfit = newMonth.revenue.total - newMonth.cogs.total;
    newMonth.expenses.labor.total = newMonth.expenses.labor.wages + newMonth.expenses.labor.salaries;
    newMonth.expenses.gAndA.total = newMonth.expenses.gAndA.posFees + newMonth.expenses.gAndA.deliveryCommissions + newMonth.expenses.gAndA.insurance + newMonth.expenses.gAndA.repairs;
    newMonth.expenses.total = newMonth.expenses.labor.total + newMonth.expenses.marketing + newMonth.expenses.rentAndUtilities.total + newMonth.expenses.gAndA.total;
    newMonth.operatingIncome = newMonth.grossProfit - newMonth.expenses.total;
    const taxes = newMonth.operatingIncome > 0 ? newMonth.operatingIncome * 0.25 : 0;
    newMonth.netIncome = newMonth.operatingIncome - taxes;

    forecast.push(newMonth);
    lastMonth = newMonth; // The next month starts from the one we just calculated
  }

  return forecast;
};

// --- The main hook to manage state ---
export const useForecastingAI = (baseData: MonthlyFinancials[]) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [generatedModifications, setGeneratedModifications] = useState<InteractiveModification[]>([]);
  const [forecastData, setForecastData] = useState<MonthlyFinancials[] | null>(null);

  const startAnalysis = (text: string) => {
    setGeneratedModifications([]);
    setIsLoading(true);
    setIsModalOpen(true);

    setTimeout(() => {
      // We only need the latest 12 months for the AI to base its assumptions on
      const analysisData = baseData.slice(-12);
      const modifications = analyzeTextForModifications(text, analysisData);
      setGeneratedModifications(modifications);
      setIsLoading(false);
    }, 1500);
  };

  const applyForecast = (approvedModifications: InteractiveModification[]) => {
    if (approvedModifications.length > 0) {
        // The engine now uses the latest 12 months as its starting point
        const forecastBase = baseData.slice(-12);
        const newForecastData = runForecastEngine(forecastBase, approvedModifications);
        setForecastData(newForecastData);
    } else {
        setForecastData(null);
    }
    setIsModalOpen(false);
  };

  const clearForecast = () => {
    setForecastData(null);
  };

  const updateModification = (id: string, newValue: number) => {
    setGeneratedModifications(currentMods =>
      currentMods.map(mod =>
        mod.id === id
          ? { ...mod, parameter: { ...mod.parameter, value: newValue } }
          : mod
      )
    );
  };

  return {
    isModalOpen,
    closeModal: () => setIsModalOpen(false),
    isLoading,
    startAnalysis,
    generatedModifications,
    updateModification,
    applyForecast,
    forecastData,
    clearForecast,
    isPlanning: forecastData !== null,
  };
};