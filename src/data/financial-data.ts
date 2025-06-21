// src/data/financial-data.ts

// A detailed interface for one month of financial data
export interface MonthlyFinancials {
  date: Date;
  revenue: {
    inStore: number;
    delivery: number;
    catering: number;
    total: number;
  };
  cogs: {
    food: number;
    beverages: number;
    packaging: number;
    total: number;
  };
  grossProfit: number;
  expenses: {
    labor: {
      wages: number;
      salaries: number;
      total: number;
    };
    marketing: number;
    rentAndUtilities: {
      rent: number;
      utilities: number;
      total: number;
    };
    gAndA: { // General & Administrative
      posFees: number;
      deliveryCommissions: number;
      insurance: number;
      repairs: number;
      total: number;
    };
    total: number;
  };
  operatingIncome: number;
  netIncome: number;
}

// Generates the full dataset from Jan 2020 to May 2025
export const generateFinancialData = (): MonthlyFinancials[] => {
  const data: MonthlyFinancials[] = [];
  const startDate = new Date('2020-01-01T00:00:00Z');
  const endDate = new Date('2025-05-01T00:00:00Z');

  let currentDate = new Date(startDate);

  while (currentDate <= endDate) {
    // --- Base Values & Growth Simulation ---
    const monthIndex = (currentDate.getFullYear() - startDate.getFullYear()) * 12 + currentDate.getMonth();
    const growthFactor = Math.pow(1.006, monthIndex); // Slow, steady growth
    const randomFluctuation = 0.95 + Math.random() * 0.1; // +/- 5% random variance

    // --- Revenue ---
    const baseRevenue = 60000 * growthFactor * randomFluctuation;
    const revenue = {
      inStore: baseRevenue * 0.6,
      delivery: baseRevenue * 0.35,
      catering: baseRevenue * 0.05,
      total: 0,
    };
    revenue.total = revenue.inStore + revenue.delivery + revenue.catering;

    // --- COGS (Cost of Goods Sold) ---
    const cogs = {
      food: revenue.total * 0.25,
      beverages: revenue.total * 0.08,
      packaging: revenue.total * 0.02,
      total: 0,
    };
    cogs.total = cogs.food + cogs.beverages + cogs.packaging;

    const grossProfit = revenue.total - cogs.total;

    // --- Operating Expenses ---
    const labor = {
        wages: revenue.total * 0.22,
        salaries: 8000 * Math.pow(1.03, currentDate.getFullYear() - startDate.getFullYear()), // Annual salary raises
        total: 0,
    };
    labor.total = labor.wages + labor.salaries;

    const rentAndUtilities = {
        rent: 5000 * Math.pow(1.02, currentDate.getFullYear() - startDate.getFullYear()), // Annual rent increase
        utilities: 1500 + Math.random() * 500,
        total: 0
    };
    rentAndUtilities.total = rentAndUtilities.rent + rentAndUtilities.utilities;

    const gAndA = {
        posFees: revenue.total * 0.01,
        deliveryCommissions: revenue.delivery * 0.15, // Commission on delivery revenue only
        insurance: 1000,
        repairs: 500 + Math.random() * 1000,
        total: 0,
    };
    gAndA.total = gAndA.posFees + gAndA.deliveryCommissions + gAndA.insurance + gAndA.repairs;

    const expenses = {
        labor,
        marketing: revenue.total * 0.03,
        rentAndUtilities,
        gAndA,
        total: 0
    }
    expenses.total = expenses.labor.total + expenses.marketing + expenses.rentAndUtilities.total + expenses.gAndA.total;

    const operatingIncome = grossProfit - expenses.total;

    // Simple tax calculation for this model
    const taxes = operatingIncome > 0 ? operatingIncome * 0.25 : 0;
    const netIncome = operatingIncome - taxes;
    
    data.push({
      date: new Date(currentDate),
      revenue,
      cogs,
      grossProfit,
      expenses,
      operatingIncome,
      netIncome,
    });

    currentDate.setUTCMonth(currentDate.getUTCMonth() + 1);
  }

  return data;
};