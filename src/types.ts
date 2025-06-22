export type DataType = 'actual' | 'forecast';

export interface ChartableData {
  date: Date;
  revenue: number;
  grossProfit: number;
  cogs: number;
  opex: number;
  netIncome: number;
  type: DataType;
  month: string;
}