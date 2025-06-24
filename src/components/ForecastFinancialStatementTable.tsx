import React from "react";
import {
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TableContainer,
  Box,
  Text,
} from "@chakra-ui/react";

export interface ForecastTableProps {
  months: string[]; // e.g. ["Jan 2024", "Feb 2024", ...]
  lineItems: {
    name: string;
    values: number[];
    isModified?: boolean;
    modificationDescription?: string;
  }[];
}

const ForecastFinancialStatementTable: React.FC<ForecastTableProps> = ({
  months,
  lineItems,
}) => {
  return (
    <Box bg="white" borderRadius="lg" boxShadow="sm" p={4}>
      <TableContainer overflowX="auto">
        <Table variant="simple" size="sm">
          <Thead>
            <Tr>
              <Th
                position="sticky"
                left={0}
                bg="white"
                zIndex={2}
                minW="160px"
              >
                Line Item
              </Th>
              {months.map((month, idx) => (
                <Th key={idx}>{month}</Th>
              ))}
            </Tr>
          </Thead>
          <Tbody>
            {lineItems.map((item, rowIdx) => (
              <Tr key={rowIdx}>
                <Td
                  position="sticky"
                  left={0}
                  bg={item.isModified ? "#fffbe6" : "white"}
                  zIndex={1}
                  fontWeight={item.isModified ? "bold" : "normal"}
                  title={item.modificationDescription || ""}
                  minW="160px"
                >
                  <Box display="flex" alignItems="center">
                    <Text as={item.isModified ? "b" : "span"}>
                      {item.name}
                    </Text>
                    {item.isModified && item.modificationDescription && (
                      <Text
                        color="#faad14"
                        ml={2}
                        fontSize="xs"
                        as="span"
                        whiteSpace="nowrap"
                      >
                        &#9888; {item.modificationDescription}
                      </Text>
                    )}
                  </Box>
                </Td>
                {item.values.map((value, colIdx) => (
                  <Td
                    key={colIdx}
                    bg={item.isModified ? "#fffbe6" : "white"}
                    border="1px solid #eee"
                    textAlign="right"
                    px={2}
                    py={1}
                  >
                    {value.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                  </Td>
                ))}
              </Tr>
            ))}
          </Tbody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default ForecastFinancialStatementTable;