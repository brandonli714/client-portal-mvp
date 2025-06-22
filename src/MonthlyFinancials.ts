// src/MonthlyFinancials.ts
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