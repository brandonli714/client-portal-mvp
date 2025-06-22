// src/hooks/useForecasting.ts
import { useState, useMemo } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { MonthlyFinancials } from '../MonthlyFinancials';
import nlp from 'compromise';
import nlpDate from 'compromise-dates';
nlp.plugin(nlpDate);

// --- Type Definitions (Correct and Final) ---
export interface Message {
  id: string;
  text: string;
  sender: 'user' | 'bot';
}

interface Parameter {
  value: number;
  min: number;
  max: number;
  step: number;
}

// This now supports two kinds of modifications
export type ModificationType = 'percentage' | 'fixed';

export interface InteractiveModification {
  id: string;
  type: ModificationType;
  target: {
    category: 'revenue' | 'cogs' | 'expenses';
    item: string;
  };
  // For 'percentage' type, this is a parameter object. For 'fixed', it's just a number.
  parameter: Parameter | number;
  // This is now a simple string description, not a template function
  description: string;
  explanation: string;
  // Optional date for fixed changes
  startDate?: Date;
}

interface PendingQuestion {
  text: string;
  handler: (responseText: string) => void;
}

const createBotMessage = (text: string): Message => ({
  id: uuidv4(),
  sender: 'bot',
  text,
});

const formatAsCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(value);
}

// --- The Main Hook ---
export const useForecastingAI = (actuals: MonthlyFinancials[]) => {
  const [isModalOpen, setModalOpen] = useState(false);
  const [isLoading, setLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [pendingQuestion, setPendingQuestion] = useState<PendingQuestion | null>(null);
  const [activeModifications, setActiveModifications] = useState<InteractiveModification[]>([]);
  const [forecastData, setForecastData] = useState<MonthlyFinancials[] | null>(null);

  const chartOfAccounts = useMemo(() => {
    if (!actuals.length) return { revenue: [], cogs: [], expenses: [] };
    const latest = actuals[actuals.length - 1];
    return {
      revenue: Object.keys(latest.revenue).filter(k => k !== 'total'),
      cogs: Object.keys(latest.cogs).filter(k => k !== 'total'),
      expenses: ['wages', 'salaries', 'marketing', 'rent', 'utilities', 'posFees', 'deliveryCommissions', 'insurance', 'repairs'],
    };
  }, [actuals]);

  const allAccounts = useMemo(() => [
    ...chartOfAccounts.revenue,
    ...chartOfAccounts.cogs,
    ...chartOfAccounts.expenses
  ], [chartOfAccounts]);

  const openModal = () => {
    setMessages([createBotMessage("Hello! Describe a change to model its financial impact.")]);
    setActiveModifications([]);
    setPendingQuestion(null);
    setForecastData(null);
    setModalOpen(true);
  };

  const closeModal = () => setModalOpen(false);

  const processNlp = (doc: any, text: string) => {
    const foundTerms = doc.terms().out('array');
    const verbs = doc.verbs().out('array');
    const nouns = doc.nouns().out('array');
    const dates = doc.dates().get();

    let targetItem = '';
    for (const term of [...nouns, ...foundTerms]) {
        const match = allAccounts.find(acc => acc.toLowerCase() === term.toLowerCase());
        if (match) {
            targetItem = match;
            break;
        }
    }

    if (!targetItem) {
        setPendingQuestion({
            text: `I'm not sure which financial item you're referring to. Did you mean one of these: ${allAccounts.join(', ')}?`,
            handler: (clarification) => {
                const clarifiedItem = allAccounts.find(acc => acc.toLowerCase() === clarification.toLowerCase().trim());
                if (clarifiedItem) {
                    processNlp(nlp(text), text);
                } else {
                    setMessages(prev => [...prev, createBotMessage("I'm sorry, I couldn't identify that item. Please try rephrasing.")]);
                }
                setPendingQuestion(null);
            }
        });
        return;
    }

    const category = chartOfAccounts.cogs.includes(targetItem) ? 'cogs'
                   : chartOfAccounts.revenue.includes(targetItem) ? 'revenue'
                   : 'expenses';

    const date = dates.length > 0 ? dates[0].start : null;
    const fixedCostIntent = verbs.some((v: any) => ['hire', 'add', 'set'].includes(v.toLowerCase()));

    if (fixedCostIntent || date) {
        setPendingQuestion({
            text: `Okay, a fixed change to ${targetItem}. What is the expected monthly dollar amount?`,
            handler: (responseText) => {
                const amount = parseFloat(responseText.replace(/[^0-9.-]+/g, ''));
                if (isNaN(amount)) {
                    setMessages(prev => [...prev, createBotMessage("Please provide a monthly dollar amount.")]);
                    setPendingQuestion(prev => prev);
                    return;
                }
                const newModification: InteractiveModification = {
                    id: uuidv4(), type: 'fixed',
                    target: { category, item: targetItem },
                    parameter: amount,
                    startDate: date || new Date(),
                    description: `Add ${formatAsCurrency(amount)}/month to ${targetItem}`,
                    explanation: `Models a recurring fixed cost change.`,
                };
                setMessages(prev => [...prev, createBotMessage(`Okay, I've modeled that change. You can describe another change or apply the forecast.`)]);
                setActiveModifications(prev => [...prev, newModification]);
                setPendingQuestion(null);
            }
        });
        return;
    }

    setPendingQuestion({
        text: `Great. By what percentage should we change ${targetItem}?`,
        handler: (responseText) => {
            const percentage = parseFloat(responseText.replace(/[^0-9.-]+/g, ''));
            if (isNaN(percentage)) {
                setMessages(prev => [...prev, createBotMessage("Please provide a valid percentage.")]);
                setPendingQuestion(prev => prev);
                return;
            }
            const newModification: InteractiveModification = {
                id: uuidv4(), type: 'percentage',
                target: { category, item: targetItem },
                parameter: { value: percentage, min: -50, max: 50, step: 1 },
                description: `Change ${targetItem} by ${percentage.toFixed(2)}%`,
                explanation: `Models a percentage change in ${targetItem}.`
            };
            setActiveModifications(prev => [...prev, newModification]);
            setMessages(prev => [...prev, createBotMessage(`Okay, I've modeled that change. You can describe another change or apply the forecast.`)]);
            setPendingQuestion(null);
        }
    });
  };

  const onSendMessage = async (text: string) => {
    setMessages(prev => [...prev, { id: uuidv4(), sender: 'user', text }]);
    setLoading(true);
    try {
        if (pendingQuestion) {
            pendingQuestion.handler(text);
        } else {
            processNlp(nlp(text), text);
        }
    } catch (error) {
        console.error("Error processing message:", error);
        setMessages(prev => [...prev, createBotMessage("I encountered an error. Please try again.")]);
    } finally {
        setLoading(false);
    }
  };

  const onUpdateModification = (id: string, value: number) => {
    setActiveModifications(prevMods => prevMods.map(mod => {
      if (mod.id === id && mod.type === 'percentage') {
        const newParam = { ...(mod.parameter as Parameter), value };
        return { ...mod, parameter: newParam, description: `Change ${mod.target.item} by ${value.toFixed(2)}%` };
      }
      return mod;
    }));
  };

  const onApply = () => {
     console.log("Applying modifications:", activeModifications);
     closeModal();
  };

  const clearForecast = () => {
      setForecastData(null);
  };

  return {
    isModalOpen,
    openModal,
    closeModal,
    isLoading,
    messages,
    activeModifications,
    onSendMessage,
    onUpdateModification,
    onApply,
    forecastData,
    clearForecast,
    assumptions: [],
  };
};