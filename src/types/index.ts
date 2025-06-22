export interface ChartableData {
  date: Date;
  revenue: number;
  netIncome: number;
  type: 'actual' | 'forecast';
  month: string;
}

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
    gAndA: {
      insurance: number;
      software: number;
      other: number;
      total: number;
    };
    total: number;
  };
  operatingIncome: number;
  netIncome: number;
} 