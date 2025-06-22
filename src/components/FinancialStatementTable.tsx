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
import { MonthlyFinancials } from '../MonthlyFinancials';

interface FinancialStatementTableProps {
  data: MonthlyFinancials[];
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
  data: number[];
  isBold?: boolean;
  isSubItem?: boolean;
  isSubSubItem?: boolean;
}> = ({ label, data, isBold = false, isSubItem = false, isSubSubItem = false }) => {
  const total = data.reduce((sum, val) => sum + val, 0);

  const textStyle: React.CSSProperties = {
      paddingLeft: isSubSubItem ? '40px' : isSubItem ? '20px' : '0px',
  };

  return (
    <Tr fontWeight={isBold ? 'bold' : 'normal'} bg={isBold ? 'gray.50' : 'transparent'}>
      <Td style={textStyle}><Text as={isBold ? 'b' : 'span'}>{label}</Text></Td>
      {data.map((value, index) => (
        <Td key={index} isNumeric>{formatCurrency(value)}</Td>
      ))}
      <Td isNumeric fontWeight="bold">{formatCurrency(total)}</Td>
    </Tr>
  );
};

export const FinancialStatementTable: React.FC<FinancialStatementTableProps> = ({ data }) => {
  if (!data || data.length === 0) {
    return <Text>No data available for the selected year.</Text>;
  }

  const months = data.map(d => d.date.toLocaleString('default', { month: 'short' }));

  const getMonthlyValues = (selector: (d: MonthlyFinancials) => number) => {
    return data.map(selector);
  };

  return (
    <Box bg="white" borderRadius="lg" boxShadow="sm">
      <TableContainer>
        <Table variant="simple" size="sm">
          <Thead>
            <Tr>
              <Th>Metric</Th>
              {months.map(month => (
                <Th key={month} isNumeric>{month}</Th>
              ))}
              <Th isNumeric>YTD Total</Th>
            </Tr>
          </Thead>
          <Tbody>
            {/* Revenue */}
            <FinancialRow label="Revenue" data={getMonthlyValues(d => d.revenue.total)} isBold />
            <FinancialRow label="In-Store" data={getMonthlyValues(d => d.revenue.inStore)} isSubItem />
            <FinancialRow label="Delivery" data={getMonthlyValues(d => d.revenue.delivery)} isSubItem />
            <FinancialRow label="Catering" data={getMonthlyValues(d => d.revenue.catering)} isSubItem />

            {/* COGS */}
            <FinancialRow label="Cost of Goods Sold" data={getMonthlyValues(d => d.cogs.total)} isBold />
            <FinancialRow label="Food" data={getMonthlyValues(d => d.cogs.food)} isSubItem />
            <FinancialRow label="Beverages" data={getMonthlyValues(d => d.cogs.beverages)} isSubItem />
            <FinancialRow label="Packaging" data={getMonthlyValues(d => d.cogs.packaging)} isSubItem />

            {/* Gross Profit */}
            <FinancialRow label="Gross Profit" data={getMonthlyValues(d => d.grossProfit)} isBold />

            {/* Operating Expenses */}
            <FinancialRow label="Operating Expenses" data={getMonthlyValues(d => d.expenses.total)} isBold />
            <FinancialRow label="Labor" data={getMonthlyValues(d => d.expenses.labor.total)} isSubItem />
            <FinancialRow label="Wages" data={getMonthlyValues(d => d.expenses.labor.wages)} isSubSubItem />
            <FinancialRow label="Management Salaries" data={getMonthlyValues(d => d.expenses.labor.salaries)} isSubSubItem />
            <FinancialRow label="Rent & Utilities" data={getMonthlyValues(d => d.expenses.rentAndUtilities.total)} isSubItem />
            <FinancialRow label="Rent" data={getMonthlyValues(d => d.expenses.rentAndUtilities.rent)} isSubSubItem />
            <FinancialRow label="Utilities" data={getMonthlyValues(d => d.expenses.rentAndUtilities.utilities)} isSubSubItem />
            <FinancialRow label="Marketing" data={getMonthlyValues(d => d.expenses.marketing)} isSubItem />
            <FinancialRow label="General & Admin" data={getMonthlyValues(d => d.expenses.gAndA.total)} isSubItem />
            <FinancialRow label="POS Fees" data={getMonthlyValues(d => d.expenses.gAndA.posFees)} isSubSubItem />
            <FinancialRow label="Delivery Commissions" data={getMonthlyValues(d => d.expenses.gAndA.deliveryCommissions)} isSubSubItem />
            <FinancialRow label="Insurance" data={getMonthlyValues(d => d.expenses.gAndA.insurance)} isSubSubItem />
            <FinancialRow label="Repairs & Maintenance" data={getMonthlyValues(d => d.expenses.gAndA.repairs)} isSubSubItem />
            
            {/* Operating Income */}
            <FinancialRow label="Operating Income" data={getMonthlyValues(d => d.operatingIncome)} isBold />

            {/* Net Income */}
            <FinancialRow label="Net Income" data={getMonthlyValues(d => d.netIncome)} isBold />
          </Tbody>
        </Table>
      </TableContainer>
    </Box>
  );
};