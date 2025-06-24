import { useState, useMemo } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { MonthlyFinancials } from '../MonthlyFinancials';

export interface Message { id: string; text: string; sender: 'user' | 'bot'; }
export type ModificationType = 'percentage' | 'fixed';
export interface InteractiveModification {
  id: string; type: ModificationType; category: string; item: string; value: number;
  startDate?: string; description?: string;
}
const createBotMessage = (text: string): Message => ({ id: uuidv4(), sender: 'bot', text });
const safe = (v: any) => typeof v === 'number' && !isNaN(v) ? v : 0;
function getNested(obj: any, path: string[]) {
  return path.reduce((acc, key) => (acc && acc[key] !== undefined ? acc[key] : undefined), obj);
}
function setNested(obj: any, path: string[], value: number) {
  const lastKey = path[path.length - 1];
  const parent = path.slice(0, -1).reduce((acc, key) => acc[key], obj);
  parent[lastKey] = value;
}
function findPath(obj: any, target: string, basePath: string[] = []): string[] | null {
  if (typeof obj !== 'object' || obj === null) return null;
  for (const key of Object.keys(obj)) {
    if (key === target) return [...basePath, key];
    const subPath = findPath(obj[key], target, [...basePath, key]);
    if (subPath) return subPath;
  }
  return null;
}
export const useForecastingAI = (actuals: MonthlyFinancials[]) => {
  const [isModalOpen, setModalOpen] = useState(false);
  const [isLoading, setLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [activeModifications, setActiveModifications] = useState<InteractiveModification[]>([]);
  const [forecastData, setForecastData] = useState<MonthlyFinancials[] | null>(null);

  const chartOfAccounts = useMemo(() => {
    if (!actuals.length) return { revenue: [], cogs: [], expenses: [] };
    const latest = actuals[actuals.length - 1];
    return {
      revenue: Object.keys(latest.revenue).filter(k => k !== 'total'),
      cogs: Object.keys(latest.cogs).filter(k => k !== 'total'),
      expenses: latest.expenses,
    };
  }, [actuals]);

  const openModal = () => {
    setMessages([createBotMessage("Hello! Describe a change to model its financial impact.")]);
    setActiveModifications([]);
    setForecastData(null);
    setModalOpen(true);
  };

  const closeModal = () => setModalOpen(false);
  const onSendMessage = async (text: string) => {
    const newMessages: Message[] = [
      ...messages,
      { id: uuidv4(), sender: 'user', text }
    ];
    setMessages(newMessages);
    setLoading(true);
    try {
      const response = await fetch('http://localhost:3001/api/forecast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userQuery: text,
          actuals: actuals,
          chartOfAccounts: chartOfAccounts,
          conversationHistory: newMessages.slice(1),
        }),
      });
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const result = await response.json();
      if (result.responseType === 'question') {
        setMessages(prev => [...prev, createBotMessage(result.data)]);
      } else if (result.responseType === 'modification') {
        const newModifications = result.data.map((mod: any) => ({ ...mod, id: uuidv4() }));
        setActiveModifications(prev => [...prev, ...newModifications]);
        setMessages(prev => [...prev, createBotMessage("Okay, I've modeled that change. You can describe another change or apply the forecast.")]);
      }
    } catch (error) {
      console.error("Error calling backend API:", error);
      setMessages(prev => [...prev, createBotMessage("Sorry, I encountered an error. Please try again.")]);
    } finally {
      setLoading(false);
    }
  };
  const onApply = () => {
    setLoading(true);
    const forecastMonths = 12;
    const lastActual = actuals[actuals.length - 1];
    let prevMonth = JSON.parse(JSON.stringify(lastActual));
    const newForecast: MonthlyFinancials[] = [];
    for (let i = 1; i <= forecastMonths; i++) {
      const monthData = JSON.parse(JSON.stringify(prevMonth));
      const forecastDate = new Date(prevMonth.date);
      forecastDate.setMonth(forecastDate.getMonth() + 1);
      monthData.date = forecastDate;

      // Only apply modifications to the first forecast month
      if (i === 1) {
        activeModifications.forEach(mod => {
          const modStartDate = mod.startDate ? new Date(mod.startDate) : null;
          if (modStartDate && monthData.date < modStartDate) return;
          let path: string[] | null = null;
          if (mod.category === 'expenses') {
            path = findPath(monthData.expenses, mod.item, ['expenses']);
          } else if (mod.category in monthData) {
            path = findPath(monthData[mod.category], mod.item, [mod.category]);
          }
          if (path) {
            const current = getNested(monthData, path);
            if (typeof current === 'number' && !isNaN(current)) {
              let newValue = current;
              if (mod.type === 'percentage') newValue = current * (1 + (mod.value / 100));
              if (mod.type === 'fixed') newValue = current + mod.value;
              setNested(monthData, path, newValue);
            } else if (typeof current === 'object' && current !== null) {
              // If the path points to an object, apply to all numeric children
              Object.keys(current).forEach(key => {
                if (typeof current[key] === 'number' && !isNaN(current[key])) {
                  let newValue = current[key];
                  if (mod.type === 'percentage') newValue = current[key] * (1 + (mod.value / 100));
                  if (mod.type === 'fixed') newValue = current[key] + mod.value;
                  current[key] = newValue;
                }
              });
            } else {
              console.warn('Modification skipped, not a number or object at path:', path.join('.'), mod);
            }
          } else {
            console.warn('Could not find path for modification:', mod);
          }
        });
      }

      // Defensive: only set .total if parent is an object
      if (typeof monthData.revenue === 'object' && monthData.revenue !== null) {
        monthData.revenue.total = safe(monthData.revenue.inStore) + safe(monthData.revenue.delivery) + safe(monthData.revenue.catering);
      }
      if (typeof monthData.cogs === 'object' && monthData.cogs !== null) {
        monthData.cogs.total = safe(monthData.cogs.food) + safe(monthData.cogs.beverages) + safe(monthData.cogs.packaging);
      }
      if (monthData.expenses && typeof monthData.expenses.labor === 'object' && monthData.expenses.labor !== null) {
        monthData.expenses.labor.total = safe(monthData.expenses.labor.wages) + safe(monthData.expenses.labor.salaries);
      }
      if (monthData.expenses && typeof monthData.expenses.rentAndUtilities === 'object' && monthData.expenses.rentAndUtilities !== null) {
        monthData.expenses.rentAndUtilities.total = safe(monthData.expenses.rentAndUtilities.rent) + safe(monthData.expenses.rentAndUtilities.utilities);
      }
      if (monthData.expenses && typeof monthData.expenses.gAndA === 'object' && monthData.expenses.gAndA !== null) {
        monthData.expenses.gAndA.total = safe(monthData.expenses.gAndA.posFees) + safe(monthData.expenses.gAndA.deliveryCommissions) + safe(monthData.expenses.gAndA.insurance) + safe(monthData.expenses.gAndA.repairs);
      }
      if (monthData.expenses) {
        monthData.expenses.total =
          safe(monthData.expenses.labor && monthData.expenses.labor.total) +
          safe(monthData.expenses.marketing) +
          safe(monthData.expenses.rentAndUtilities && monthData.expenses.rentAndUtilities.total) +
          safe(monthData.expenses.gAndA && monthData.expenses.gAndA.total);
      }
      monthData.netIncome = safe(monthData.revenue && monthData.revenue.total) - safe(monthData.cogs && monthData.cogs.total) - safe(monthData.expenses && monthData.expenses.total);

      newForecast.push(monthData);
      prevMonth = monthData;
    }
    setForecastData(newForecast);
    setLoading(false);
    closeModal();
  };

  const clearForecast = () => {
    setForecastData(null);
    setActiveModifications([]);
  };

  return {
    isModalOpen, openModal, closeModal, isLoading, messages, activeModifications,
    onSendMessage, onApply,
    forecastData, clearForecast,
  };
};