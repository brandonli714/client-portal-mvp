// src/components/FinancialStatementTable.tsx
import React from 'react';
import {
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TableContainer,
  Text,
  Box,
} from '@chakra-ui/react';
import { MonthlyFinancials } from '../data/financial-data';

interface FinancialStatementTableProps {
  actualData: MonthlyFinancials[];
  forecastData: MonthlyFinancials[] | null;
}

const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
};

const FinancialRow: React.FC<{
  label: string;
  actualData: number[];
  forecastData?: number[];
  isBold?: boolean;
  isSubItem?: boolean;
  isSubSubItem?: boolean;
}> = ({ label, actualData, forecastData, isBold = false, isSubItem = false, isSubSubItem = false }) => {
  const actualTotal = actualData.reduce((sum, val) => sum + val, 0);
  const forecastTotal = forecastData?.reduce((sum, val) => sum + val, 0);

  const textStyle: React.CSSProperties = {
      paddingLeft: isSubSubItem ? '40px' : isSubItem ? '20px' : '0px',
  };

  return (
    <Tr fontWeight={isBold ? 'bold' : 'normal'} bg={isBold ? 'gray.50' : 'transparent'}>
      <Td style={textStyle}><Text as={isBold ? 'b' : 'span'}>{label}</Text></Td>
      {actualData.map((value, index) => (
        <React.Fragment key={index}>
            <Td isNumeric>{formatCurrency(value)}</Td>
            {forecastData && <Td isNumeric color="blue.600">{formatCurrency(forecastData[index])}</Td>}
        </React.Fragment>
      ))}
      <Td isNumeric fontWeight="bold">{formatCurrency(actualTotal)}</Td>
      {forecastData && forecastTotal !== undefined && <Td isNumeric fontWeight="bold" color="blue.600">{formatCurrency(forecastTotal)}</Td>}
    </Tr>
  );
};

export const FinancialStatementTable: React.FC<FinancialStatementTableProps> = ({ actualData, forecastData }) => {
  if (!actualData || actualData.length === 0) {
    return <Text>No data available for the selected year.</Text>;
  }

  const isPlanning = forecastData !== null;
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const relevantMonths = months.slice(0, actualData.length);

  const getMonthlyValues = (selector: (d: MonthlyFinancials) => number) => {
    const actual = actualData.map(selector);
    const forecast = isPlanning ? forecastData.map(selector) : undefined;
    return { actual, forecast };
  };
  
  return (
    <Box bg="white" borderRadius="lg" boxShadow="sm">
      <TableContainer>
        <Table variant="simple" size="sm">
          <Thead>
            <Tr>
              <Th rowSpan={2} verticalAlign="bottom" position="sticky" left="0" bg="white" zIndex="1">Metric</Th>
              {relevantMonths.map(month => (
                <Th key={month} isNumeric colSpan={isPlanning ? 2 : 1} textAlign="center">{month}</Th>
              ))}
              <Th isNumeric colSpan={isPlanning ? 2 : 1} textAlign="center">YTD Total</Th>
            </Tr>
            {isPlanning && <Tr>
                {relevantMonths.map(month => (
                    <React.Fragment key={`${month}-sub`}>
                        <Th isNumeric>Actual</Th>
                        <Th isNumeric color="blue.500">Forecast</Th>
                    </React.Fragment>
                ))}
                <Th isNumeric>Actual</Th>
                <Th isNumeric color="blue.500">Forecast</Th>
            </Tr>}
          </Thead>
          <Tbody>
            {/* Revenue */}
            <FinancialRow label="Revenue" actualData={getMonthlyValues(d => d.revenue.total).actual} forecastData={getMonthlyValues(d => d.revenue.total).forecast} isBold />
            <FinancialRow label="In-Store" actualData={getMonthlyValues(d => d.revenue.inStore).actual} forecastData={getMonthlyValues(d => d.revenue.inStore).forecast} isSubItem />
            <FinancialRow label="Delivery" actualData={getMonthlyValues(d => d.revenue.delivery).actual} forecastData={getMonthlyValues(d => d.revenue.delivery).forecast} isSubItem />
            <FinancialRow label="Catering" actualData={getMonthlyValues(d => d.revenue.catering).actual} forecastData={getMonthlyValues(d => d.revenue.catering).forecast} isSubItem />

            {/* COGS */}
            <FinancialRow label="Cost of Goods Sold" actualData={getMonthlyValues(d => d.cogs.total).actual} forecastData={getMonthlyValues(d => d.cogs.total).forecast} isBold />
            <FinancialRow label="Food" actualData={getMonthlyValues(d => d.cogs.food).actual} forecastData={getMonthlyValues(d => d.cogs.food).forecast} isSubItem />
            <FinancialRow label="Beverages" actualData={getMonthlyValues(d => d.cogs.beverages).actual} forecastData={getMonthlyValues(d => d.cogs.beverages).forecast} isSubItem />
            <FinancialRow label="Packaging" actualData={getMonthlyValues(d => d.cogs.packaging).actual} forecastData={getMonthlyValues(d => d.cogs.packaging).forecast} isSubItem />
            
            {/* Gross Profit */}
            <FinancialRow label="Gross Profit" actualData={getMonthlyValues(d => d.grossProfit).actual} forecastData={getMonthlyValues(d => d.grossProfit).forecast} isBold />

            {/* Operating Expenses */}
            <FinancialRow label="Operating Expenses" actualData={getMonthlyValues(d => d.expenses.total).actual} forecastData={getMonthlyValues(d => d.expenses.total).forecast} isBold />
            <FinancialRow label="Labor" actualData={getMonthlyValues(d => d.expenses.labor.total).actual} forecastData={getMonthlyValues(d => d.expenses.labor.total).forecast} isSubItem />
            <FinancialRow label="Wages" actualData={getMonthlyValues(d => d.expenses.labor.wages).actual} forecastData={getMonthlyValues(d => d.expenses.labor.wages).forecast} isSubSubItem />
            <FinancialRow label="Management Salaries" actualData={getMonthlyValues(d => d.expenses.labor.salaries).actual} forecastData={getMonthlyValues(d => d.expenses.labor.salaries).forecast} isSubSubItem />
            <FinancialRow label="Rent & Utilities" actualData={getMonthlyValues(d => d.expenses.rentAndUtilities.total).actual} forecastData={getMonthlyValues(d => d.expenses.rentAndUtilities.total).forecast} isSubItem />
            <FinancialRow label="Rent" actualData={getMonthlyValues(d => d.expenses.rentAndUtilities.rent).actual} forecastData={getMonthlyValues(d => d.expenses.rentAndUtilities.rent).forecast} isSubSubItem />
            <FinancialRow label="Utilities" actualData={getMonthlyValues(d => d.expenses.rentAndUtilities.utilities).actual} forecastData={getMonthlyValues(d => d.expenses.rentAndUtilities.utilities).forecast} isSubSubItem />
            <FinancialRow label="Marketing" actualData={getMonthlyValues(d => d.expenses.marketing).actual} forecastData={getMonthlyValues(d => d.expenses.marketing).forecast} isSubItem />
            <FinancialRow label="General & Admin" actualData={getMonthlyValues(d => d.expenses.gAndA.total).actual} forecastData={getMonthlyValues(d => d.expenses.gAndA.total).forecast} isSubItem />
            <FinancialRow label="POS Fees" actualData={getMonthlyValues(d => d.expenses.gAndA.posFees).actual} forecastData={getMonthlyValues(d => d.expenses.gAndA.posFees).forecast} isSubSubItem />
            <FinancialRow label="Delivery Commissions" actualData={getMonthlyValues(d => d.expenses.gAndA.deliveryCommissions).actual} forecastData={getMonthlyValues(d => d.expenses.gAndA.deliveryCommissions).forecast} isSubSubItem />
            <FinancialRow label="Insurance" actualData={getMonthlyValues(d => d.expenses.gAndA.insurance).actual} forecastData={getMonthlyValues(d => d.expenses.gAndA.insurance).forecast} isSubSubItem />
            <FinancialRow label="Repairs & Maintenance" actualData={getMonthlyValues(d => d.expenses.gAndA.repairs).actual} forecastData={getMonthlyValues(d => d.expenses.gAndA.repairs).forecast} isSubSubItem />

            {/* Operating Income */}
            <FinancialRow label="Operating Income" actualData={getMonthlyValues(d => d.operatingIncome).actual} forecastData={getMonthlyValues(d => d.operatingIncome).forecast} isBold />

            {/* Net Income */}
            <FinancialRow label="Net Income" actualData={getMonthlyValues(d => d.netIncome).actual} forecastData={getMonthlyValues(d => d.netIncome).forecast} isBold />
          </Tbody>
        </Table>
      </TableContainer>
    </Box>
  );
};