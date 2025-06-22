export interface ChartableData {
  date: Date;
  revenue: number;
  grossProfit: number;
  netIncome: number;
  type: 'actual' | 'forecast';
  month: string;
}