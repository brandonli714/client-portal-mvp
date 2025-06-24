import React, { useState, useRef, useEffect } from 'react';
import {
  Box,
  Button,
  Heading,
  VStack,
  Divider,
  Input,
  Spinner,
  Text,
  Flex,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
} from '@chakra-ui/react';
import { useForecastingAI } from '../hooks/useForecasting';
import { staticFinancials } from '../staticFinancials';

// Helper to get nested values by path
function getValueByPath(obj: any, path: string[]) {
  return path.reduce((acc, key) => (acc && acc[key] !== undefined ? acc[key] : 0), obj);
}

// Hierarchical line items definition
const allLineItems = [
  {
    name: 'Revenue',
    children: [
      { name: 'In Store', path: ['revenue', 'inStore'] },
      { name: 'Delivery', path: ['revenue', 'delivery'] },
      { name: 'Catering', path: ['revenue', 'catering'] },
    ],
    path: ['revenue', 'total'],
  },
  {
    name: 'COGS',
    children: [
      { name: 'Food', path: ['cogs', 'food'] },
      { name: 'Beverages', path: ['cogs', 'beverages'] },
      { name: 'Packaging', path: ['cogs', 'packaging'] },
    ],
    path: ['cogs', 'total'],
  },
  {
    name: 'Expenses',
    children: [
      {
        name: 'Labor',
        children: [
          { name: 'Wages', path: ['expenses', 'labor', 'wages'] },
          { name: 'Salaries', path: ['expenses', 'labor', 'salaries'] },
        ],
        path: ['expenses', 'labor', 'total'],
      },
      { name: 'Marketing', path: ['expenses', 'marketing'] },
      {
        name: 'Rent & Utilities',
        children: [
          { name: 'Rent', path: ['expenses', 'rentAndUtilities', 'rent'] },
          { name: 'Utilities', path: ['expenses', 'rentAndUtilities', 'utilities'] },
        ],
        path: ['expenses', 'rentAndUtilities', 'total'],
      },
      {
        name: 'G&A',
        children: [
          { name: 'POS Fees', path: ['expenses', 'gAndA', 'posFees'] },
          { name: 'Delivery Commissions', path: ['expenses', 'gAndA', 'deliveryCommissions'] },
          { name: 'Insurance', path: ['expenses', 'gAndA', 'insurance'] },
          { name: 'Repairs', path: ['expenses', 'gAndA', 'repairs'] },
        ],
        path: ['expenses', 'gAndA', 'total'],
      },
    ],
    path: ['expenses', 'total'],
  },
  { name: 'Net Income', path: ['netIncome'] },
];

type TableRow = {
  name: string;
  values: (number | null)[];
  isModified: boolean;
  modificationDescription?: string;
  level: number;
  isGroup: boolean;
};

function renderRows(
  items: any[],
  actuals: any[],
  forecastData: any[] | null,
  monthsToShow: number,
  futureMonths: number,
  activeModifications: any[],
  level = 0
): TableRow[] {
  return items.flatMap(item => {
    const mod = activeModifications?.find(
      (m: any) =>
        m.item === (item.path ? item.path[item.path.length - 1] : '') &&
        m.category === (item.path ? item.path[0] : '')
    );
    // Only use the last N actuals
    const actualValues = item.path
      ? actuals.slice(-monthsToShow).map((d: any) => getValueByPath(d, item.path))
      : [];
    // For future months, fill with forecast if available, else null
    let futureValues: (number | null)[] = [];
    if (forecastData && forecastData.length > 0) {
      futureValues = forecastData.slice(0, futureMonths).map((d: any) => getValueByPath(d, item.path));
    } else {
      futureValues = Array(futureMonths).fill(null);
    }
    const values = [...actualValues, ...futureValues];
    const row: TableRow = {
      name: item.name,
      values,
      isModified: !!mod,
      modificationDescription: mod?.description || undefined,
      level,
      isGroup: !!item.children,
    };
    const childrenRows: TableRow[] = item.children
      ? renderRows(item.children, actuals, forecastData, monthsToShow, futureMonths, activeModifications, level + 1)
      : [];
    return [row, ...childrenRows];
  });
}

// Convert date strings to Date objects for useForecastingAI
const actuals = staticFinancials.map((entry) => ({
  ...entry,
  date: new Date(entry.date),
}));

const MONTHS_TO_SHOW = 12;
const FUTURE_MONTHS = 12;

function getLastNMonthsDates(actuals: any[], n: number): Date[] {
  // Sort by date ascending
  const sorted = [...actuals].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  return sorted.slice(-n).map(d => new Date(d.date));
}

function getFutureMonths(lastDate: Date, n: number): Date[] {
  const months: Date[] = [];
  let year = lastDate.getFullYear();
  let month = lastDate.getMonth();
  for (let i = 1; i <= n; i++) {
    month += 1;
    if (month > 11) {
      month = 0;
      year += 1;
    }
    months.push(new Date(year, month, 1));
  }
  return months;
}

const ForecastingPage: React.FC = () => {
  const {
    forecastData,
    activeModifications,
    isModalOpen,
    openModal,
    closeModal,
    isLoading,
    messages,
    onSendMessage,
    onApply,
    clearForecast,
  } = useForecastingAI(actuals);

  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Insights feature state
  const [insights, setInsights] = useState<string | null>(null);
  const [isInsightsOpen, setInsightsOpen] = useState(false);
  const [isInsightsLoading, setInsightsLoading] = useState(false);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  let months: string[] = [];
  let tableRows: TableRow[] = [];
  let error: string | null = null;

  try {
    // Get last 12 months of actuals
    const last12Actuals = actuals.slice(-MONTHS_TO_SHOW);
    const last12Dates = getLastNMonthsDates(actuals, MONTHS_TO_SHOW);

    // Get next 12 months
    const lastActualDate = last12Dates.length > 0 ? last12Dates[last12Dates.length - 1] : new Date();
    const next12Dates = getFutureMonths(lastActualDate, FUTURE_MONTHS);

    months = [
      ...last12Dates.map((d: Date) =>
        d.toLocaleString('default', { month: 'short', year: 'numeric' })
      ),
      ...next12Dates.map((d: Date) =>
        d.toLocaleString('default', { month: 'short', year: 'numeric' })
      ),
    ];

    tableRows = renderRows(
      allLineItems,
      actuals,
      forecastData,
      MONTHS_TO_SHOW,
      FUTURE_MONTHS,
      activeModifications
    );
  } catch (err: any) {
    error = err.message || 'Unknown error';
  }

  const handleSend = async () => {
    if (input.trim()) {
      await onSendMessage(input.trim());
      setInput('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSend();
    }
  };

  // Insights feature: fetch insights from backend
  const getInsights = async () => {
    setInsightsLoading(true);
    setInsightsOpen(true);
    try {
      const response = await fetch('http://localhost:3001/api/insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ actuals }),
      });
      const data = await response.json();
      setInsights(data.insights);
    } catch (e) {
      setInsights("Sorry, I couldn't generate insights at this time.");
    } finally {
      setInsightsLoading(false);
    }
  };

  return (
    <Box p={8} maxW="100vw" minH="100vh" bg="gray.50">
      <VStack spacing={6} align="stretch">
        <Heading as="h1" size="xl" color="blue.700">
          24-Month Financial Forecast
        </Heading>
        <Flex gap={2}>
          <Button colorScheme="blue" onClick={openModal}>
            Create / Edit Forecast
          </Button>
          <Button variant="outline" colorScheme="gray" onClick={clearForecast}>
            Clear Forecast
          </Button>
          <Button colorScheme="purple" onClick={getInsights}>
            Get Business Insights
          </Button>
        </Flex>
        <Divider />
        {error ? (
          <Box color="red.500" p={4} borderRadius="md" bg="red.50">
            <Heading size="md">Error rendering Forecasting Page</Heading>
            <pre>{error}</pre>
          </Box>
        ) : (
          <Box overflowX="auto" bg="white" borderRadius="lg" boxShadow="sm" p={4}>
            <table style={{ minWidth: 1200, borderCollapse: "collapse", width: "100%" }}>
              <thead>
                <tr>
                  <th style={{ position: "sticky", left: 0, background: "#fff", zIndex: 2, minWidth: 180, textAlign: "left" }}>Line Item</th>
                  {months.map((month, idx) => (
                    <th key={idx}>{month}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {tableRows.map((item, idx) => (
                  <tr key={idx}>
                    <td
                      style={{
                        paddingLeft: `${item.level * 24}px`,
                        fontWeight: item.isGroup ? 'bold' : 'normal',
                        background: item.isModified ? "#fffbe6" : "#fff",
                        borderBottom: item.isGroup ? "2px solid #e2e8f0" : "1px solid #eee",
                        fontSize: item.isGroup ? "1rem" : "0.98rem",
                        verticalAlign: "middle",
                        minWidth: 180,
                      }}
                      title={item.modificationDescription || ""}
                    >
                      {item.name}
                      {item.isModified && item.modificationDescription && (
                        <span style={{ color: "#faad14", marginLeft: 6, fontSize: 12 }}>
                          &#9888; {item.modificationDescription}
                        </span>
                      )}
                    </td>
                    {item.values.map((value: number | null, colIdx: number) => (
                      <td
                        key={colIdx}
                        style={{
                          background: item.isModified ? "#fffbe6" : "#fff",
                          border: "1px solid #eee",
                          textAlign: "right",
                          padding: "4px 8px",
                        }}
                      >
                        {value !== null ? value.toLocaleString(undefined, { maximumFractionDigits: 0 }) : ''}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </Box>
        )}
      </VStack>

      {/* Conversational AI Modal */}
      <Modal isOpen={isModalOpen} onClose={closeModal} size="lg" isCentered>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Forecasting Assistant</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Box
              maxH="300px"
              overflowY="auto"
              p={2}
              bg="gray.50"
              borderRadius="md"
              mb={4}
              border="1px solid #eee"
            >
              {messages.map((msg, idx) => (
                <Box
                  key={msg.id}
                  mb={2}
                  textAlign={msg.sender === 'user' ? 'right' : 'left'}
                >
                  <Text
                    display="inline-block"
                    px={3}
                    py={2}
                    borderRadius="lg"
                    bg={msg.sender === 'user' ? 'blue.100' : 'gray.200'}
                    color="gray.800"
                    fontWeight={msg.sender === 'user' ? 'bold' : 'normal'}
                  >
                    {msg.text}
                  </Text>
                </Box>
              ))}
              {isLoading && (
                <Box textAlign="center" my={2}>
                  <Spinner size="sm" color="blue.500" />
                </Box>
              )}
              <div ref={messagesEndRef} />
            </Box>
            <Input
              placeholder="Type your forecast change..."
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              isDisabled={isLoading}
              autoFocus
            />
          </ModalBody>
          <ModalFooter>
            <Button
              colorScheme="blue"
              mr={3}
              onClick={handleSend}
              isLoading={isLoading}
              isDisabled={!input.trim()}
            >
              Send
            </Button>
            <Button
              colorScheme="green"
              onClick={onApply}
              isDisabled={activeModifications.length === 0}
            >
              Apply Forecast
            </Button>
            <Button variant="ghost" onClick={closeModal}>
              Close
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Business Insights Modal */}
      <Modal isOpen={isInsightsOpen} onClose={() => setInsightsOpen(false)} size="lg" isCentered>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Business Insights</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            {isInsightsLoading ? (
              <Spinner />
            ) : (
              <Box whiteSpace="pre-line">{insights}</Box>
            )}
          </ModalBody>
          <ModalFooter>
            <Button onClick={() => setInsightsOpen(false)}>Close</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default ForecastingPage;