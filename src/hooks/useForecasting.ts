// src/hooks/useForecasting.ts
import { useState, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import nlp from 'compromise';
import { MonthlyFinancials } from '../MonthlyFinancials';

// --- Data structure for the conversation history ---
export interface ChatMessage {
    id: string;
    sender: 'user' | 'ai';
    text: string;
}

// --- Data structure for a pending action the AI has proposed ---
interface PendingAction {
    type: 'add_modification';
    modification: ScenarioModification;
}

// Renamed for clarity
export type ScenarioModification = {
  id: string;
  descriptionTemplate: (value: number) => string;
  explanation: string;
  parameter: {
    value: number;
    min: number;
    max: number;
    step: number;
    unit: '%' | '$';
  };
  apply: (month: MonthlyFinancials, value: number) => MonthlyFinancials;
}

// --- NEW: Data structure for the core forecast model assumptions ---
export interface ForecastAssumptions {
  revenueGrowth: {
    inStoreSlope: number;
    deliverySlope: number;
    cateringSlope: number;
  };
  costRatios: {
    cogsFood: number;
    cogsBeverages: number;
    laborWages: number;
    marketing: number;
    gaDeliveryCommissions: number;
  };
  fixedCosts: {
    salaries: number;
    rent: number;
    utilities: number;
    gaInsurance: number;
  };
}

// --- Helper: Simple Linear Regression ---
const simpleLinearRegression = (y: number[]): { slope: number; intercept: number } => {
  const n = y.length;
  if (n < 2) return { slope: 0, intercept: y[0] || 0 };

  const x = Array.from({ length: n }, (_, i) => i);
  const sumX = x.reduce((a, b) => a + b, 0);
  const sumY = y.reduce((a, b) => a + b, 0);
  const sumXY = x.map((xi, i) => xi * y[i]).reduce((a, b) => a + b, 0);
  const sumXX = x.map(xi => xi * xi).reduce((a, b) => a + b, 0);

  const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;

  return { slope: isNaN(slope) ? 0 : slope, intercept: isNaN(intercept) ? 0 : intercept };
};

const formatCurrency = (value: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(value);

interface AIResponse {
    responseText: string;
    pendingAction: PendingAction | null;
}

const generateAIResponse = (text: string, baseData: MonthlyFinancials[]): AIResponse => {
    const doc = nlp(text);

    const hireIntent = doc.match('(hire|add|bring on) .? (worker|employee|cook|person|staff)');
    if (hireIntent.found) {
        let quantity = 1;
        const numbers = doc.values().numbers();
        if (numbers.length > 0) {
            quantity = numbers[0];
        }
        
        const lastMonth = baseData[baseData.length - 1];
        const estimatedEmployees = Math.round(lastMonth.revenue.total / 15000);
        const averageWage = estimatedEmployees > 0 ? lastMonth.expenses.labor.wages / estimatedEmployees : 5000;
        const wageIncrease = quantity * averageWage;
        
        const modification: ScenarioModification = {
            id: uuidv4(),
            descriptionTemplate: (val) => `Hiring ${quantity} employee(s) will increase monthly wage expenses by ~${formatCurrency(val)}.`,
            explanation: `Based on your recent financials, the average monthly wage per employee is ~${formatCurrency(averageWage)}.`,
            parameter: { value: wageIncrease, min: wageIncrease * 0.5, max: wageIncrease * 1.5, step: 100, unit: '$' },
            apply: (month, val) => { month.expenses.labor.wages += val; return month; }
        };

        return {
            responseText: `Did you mean to hire ${quantity} employee(s)? I estimate this will increase monthly wage expenses by ~${formatCurrency(wageIncrease)}. Should I add this to the forecast scenario?`,
            pendingAction: { type: 'add_modification', modification }
        };
    }

    return {
        responseText: "I'm sorry, I can only understand prompts about hiring employees right now. Could you please try rephrasing?",
        pendingAction: null
    };
};

// THIS IS THE CORRECTED FORECASTING ENGINE
const runForecastEngine = (
    baseData: MonthlyFinancials[],
    modifications: ScenarioModification[],
    assumptions: ForecastAssumptions
): MonthlyFinancials[] => {
    if (baseData.length < 2) return [];

    const ttmData = baseData.slice(-12);
    const lastActualMonth = ttmData[ttmData.length - 1];

    let lastRevenue = { ...lastActualMonth.revenue };
    
    const forecast: MonthlyFinancials[] = [];

    for (let i = 1; i <= 12; i++) {
        const nextRevenue = {
            inStore: lastRevenue.inStore + assumptions.revenueGrowth.inStoreSlope,
            delivery: lastRevenue.delivery + assumptions.revenueGrowth.deliverySlope,
            catering: lastRevenue.catering + assumptions.revenueGrowth.cateringSlope,
            total: 0
        };
        nextRevenue.total = nextRevenue.inStore + nextRevenue.delivery + nextRevenue.catering;
        
        const newDate = new Date(lastActualMonth.date);
        newDate.setUTCMonth(newDate.getUTCMonth() + i);

        // This structure now perfectly matches the MonthlyFinancials type
        let newMonth: MonthlyFinancials = {
            date: newDate,
            revenue: { ...nextRevenue },
            cogs: {
                food: nextRevenue.total * assumptions.costRatios.cogsFood,
                beverages: nextRevenue.total * assumptions.costRatios.cogsBeverages,
                packaging: 0,
                total: 0
            },
            expenses: {
                labor: {
                    wages: nextRevenue.total * assumptions.costRatios.laborWages,
                    salaries: assumptions.fixedCosts.salaries,
                    total: 0,
                },
                marketing: nextRevenue.total * assumptions.costRatios.marketing,
                rentAndUtilities: {
                    rent: assumptions.fixedCosts.rent,
                    utilities: assumptions.fixedCosts.utilities,
                    total: 0
                },
                gAndA: {
                    posFees: 0,
                    deliveryCommissions: nextRevenue.total * assumptions.costRatios.gaDeliveryCommissions,
                    insurance: assumptions.fixedCosts.gaInsurance,
                    repairs: 0,
                    total: 0
                },
                total: 0,
            },
            grossProfit: 0,
            operatingIncome: 0,
            netIncome: 0,
        };

        modifications.forEach(mod => {
            newMonth = mod.apply(newMonth, mod.parameter.value);
        });

        // Recalculate all totals correctly
        newMonth.cogs.total = newMonth.cogs.food + newMonth.cogs.beverages + newMonth.cogs.packaging;
        newMonth.grossProfit = newMonth.revenue.total - newMonth.cogs.total;
        newMonth.expenses.labor.total = newMonth.expenses.labor.wages + newMonth.expenses.labor.salaries;
        newMonth.expenses.rentAndUtilities.total = newMonth.expenses.rentAndUtilities.rent + newMonth.expenses.rentAndUtilities.utilities;
        newMonth.expenses.gAndA.total = newMonth.expenses.gAndA.posFees + newMonth.expenses.gAndA.deliveryCommissions + newMonth.expenses.gAndA.insurance + newMonth.expenses.gAndA.repairs;
        newMonth.expenses.total = newMonth.expenses.labor.total + newMonth.expenses.marketing + newMonth.expenses.rentAndUtilities.total + newMonth.expenses.gAndA.total;
        newMonth.operatingIncome = newMonth.grossProfit - newMonth.expenses.total;
        const taxes = newMonth.operatingIncome > 0 ? newMonth.operatingIncome * 0.25 : 0;
        newMonth.netIncome = newMonth.operatingIncome - taxes;

        forecast.push(newMonth);
        lastRevenue = nextRevenue;
    }
    return forecast;
};

// THIS IS THE CORRECTED ASSUMPTION CALCULATOR
const calculateDefaultAssumptions = (baseData: MonthlyFinancials[]): ForecastAssumptions => {
    const ttmData = baseData.slice(-12);
    if (ttmData.length === 0) {
        return {
            revenueGrowth: { inStoreSlope: 0, deliverySlope: 0, cateringSlope: 0 },
            costRatios: { cogsFood: 0, cogsBeverages: 0, laborWages: 0, marketing: 0, gaDeliveryCommissions: 0 },
            fixedCosts: { salaries: 0, rent: 0, utilities: 0, gaInsurance: 0 }
        };
    }

    const totalRevenue = ttmData.reduce((sum, d) => sum + d.revenue.total, 0);
    const getRatio = (selector: (d: MonthlyFinancials) => number) => totalRevenue > 0 ? ttmData.reduce((sum, d) => sum + selector(d), 0) / totalRevenue : 0;
    const getAverage = (selector: (d: MonthlyFinancials) => number) => ttmData.length > 0 ? ttmData.reduce((sum, d) => sum + selector(d), 0) / ttmData.length : 0;
    const getSlope = (selector: (d: MonthlyFinancials) => number) => simpleLinearRegression(ttmData.map(selector)).slope;

    return {
        revenueGrowth: {
            inStoreSlope: getSlope(d => d.revenue.inStore),
            deliverySlope: getSlope(d => d.revenue.delivery),
            cateringSlope: getSlope(d => d.revenue.catering),
        },
        costRatios: {
            cogsFood: getRatio(d => d.cogs.food),
            cogsBeverages: getRatio(d => d.cogs.beverages),
            laborWages: getRatio(d => d.expenses.labor.wages),
            marketing: getRatio(d => d.expenses.marketing),
            gaDeliveryCommissions: getRatio(d => d.expenses.gAndA.deliveryCommissions),
        },
        fixedCosts: {
            salaries: getAverage(d => d.expenses.labor.salaries),
            rent: getAverage(d => d.expenses.rentAndUtilities.rent),
            utilities: getAverage(d => d.expenses.rentAndUtilities.utilities),
            gaInsurance: getAverage(d => d.expenses.gAndA.insurance),
        }
    };
};

export const useForecastingAI = (baseData: MonthlyFinancials[]) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [pendingAction, setPendingAction] = useState<PendingAction | null>(null);
    const [activeModifications, setActiveModifications] = useState<ScenarioModification[]>([]);
    const [assumptions, setAssumptions] = useState<ForecastAssumptions | null>(null);
    const [forecastData, setForecastData] = useState<MonthlyFinancials[] | null>(null);

    const openModal = useCallback(() => {
        const defaultAssumptions = calculateDefaultAssumptions(baseData);
        setAssumptions(defaultAssumptions);
        setMessages([{ id: uuidv4(), sender: 'ai', text: "Hello! How can I help you model a forecast today? You can ask me to hire employees." }]);
        setActiveModifications([]);
        setPendingAction(null);
        setIsModalOpen(true);
    }, [baseData]);

    const closeModal = () => setIsModalOpen(false);

    const sendMessage = useCallback((text: string) => {
        setMessages(prev => [...prev, { id: uuidv4(), sender: 'user', text }]);
        setIsLoading(true);

        setTimeout(() => {
            const aiResponse = generateAIResponse(text, baseData);
            setMessages(prev => [...prev, { id: uuidv4(), sender: 'ai', text: aiResponse.responseText }]);
            if (aiResponse.pendingAction) {
                setPendingAction(aiResponse.pendingAction);
                setActiveModifications([aiResponse.pendingAction.modification]);
            }
            setIsLoading(false);
        }, 1000);
    }, [baseData]);

    const clearForecast = () => setForecastData(null);

    const updateAssumption = <C extends keyof ForecastAssumptions, K extends keyof ForecastAssumptions[C]>(
        category: C,
        key: K,
        value: ForecastAssumptions[C][K]
    ) => {
        setAssumptions(prev => {
            if (!prev) return null;
            return {
                ...prev,
                [category]: {
                    ...prev[category],
                    [key]: value,
                },
            };
        });
    };
    
    const updateModification = (id: string, value: number) => {
        setActiveModifications(prev =>
            prev.map(mod =>
                mod.id === id ? { ...mod, parameter: { ...mod.parameter, value } } : mod
            )
        );
    };

    const runAndApplyForecast = () => {
        if (assumptions) {
            const forecast = runForecastEngine(baseData, activeModifications, assumptions);
            setForecastData(forecast);
            closeModal();
        }
    };

    return {
        isModalOpen,
        openModal,
        closeModal,
        isLoading,
        messages,
        activeModifications,
        assumptions,
        forecastData,
        sendMessage,
        clearForecast,
        updateAssumption,
        updateModification,
        runAndApplyForecast,
    };
};