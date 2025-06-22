// src/components/FinancialStatementTable.tsx
import React from 'react';
import {
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Text,
  Box,
} from '@chakra-ui/react';
import { MonthlyFinancials } from '../MonthlyFinancials';

interface FinancialStatementTableProps {
  data: MonthlyFinancials[];
}

const formatCurrency = (value: number) => {
    // Use compact notation for large numbers to save space
    if (Math.abs(value) >= 1000) {
        const compactNumber = new Intl.NumberFormat('en-US', {
            notation: 'compact',
            compactDisplay: 'short',
            minimumFractionDigits: 1,
            maximumFractionDigits: 1
        }).format(value);
        // Prepend dollar sign since style: 'currency' is not allowed with notation: 'compact'
        return `$${compactNumber}`;
    }

    // Use standard currency formatting for smaller numbers
    return new Intl.NumberFormat('en-US', {
      style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0,
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

  // Aggressive responsive styles to help content fit
  const cellStyles = {
    px: ['1', '2', '3'], // Reduced padding
    py: '2',
    fontSize: ['xx-small', 'xs', 'sm'], // Added smaller font size for narrow screens
    whiteSpace: 'nowrap',
  };

  // Indentation for the first column's label
  const labelPaddingLeft = isSubSubItem ? 10 : isSubItem ? 5 : cellStyles.px;

  return (
    <Tr fontWeight={isBold ? 'bold' : 'normal'} bg={isBold ? 'gray.50' : 'transparent'}>
      {/* Label Cell */}
      <Td {...cellStyles} pl={labelPaddingLeft}>
        <Text as={isBold ? 'b' : 'span'}>{label}</Text>
      </Td>
      
      {/* Data Cells */}
      {data.map((value, index) => (
        <Td key={index} isNumeric {...cellStyles}>
          {formatCurrency(value)}
        </Td>
      ))}

      {/* Total Cell */}
      <Td isNumeric fontWeight="bold" {...cellStyles}>
        {formatCurrency(total)}
      </Td>
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
  
  const headerStyles = {
    px: ['1', '2', '3'], // Reduced padding
    py: '2',
    fontSize: ['xx-small', 'xs', 'sm'], // Added smaller font size
    whiteSpace: 'nowrap',
  };

  return (
    <Box bg="white" borderRadius="lg" boxShadow="sm">
      <Table variant="simple" size="sm" width="100%">
        <Thead>
          <Tr>
            <Th {...headerStyles}>Metric</Th>
            {months.map(month => (
              <Th key={month} isNumeric {...headerStyles}>{month}</Th>
            ))}
            <Th isNumeric {...headerStyles}>YTD Total</Th>
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
    </Box>
  );
};