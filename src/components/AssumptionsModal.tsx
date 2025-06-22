import React, { useState, useRef, useEffect } from 'react';
import {
  Modal, ModalOverlay, ModalContent, ModalHeader, ModalFooter, ModalBody, ModalCloseButton,
  Button, Box, VStack, Text, Textarea, Spinner,
  Tabs, TabList, Tab, TabPanels, TabPanel, Heading,
  NumberInput, NumberInputField, NumberInputStepper, NumberIncrementStepper, NumberDecrementStepper,
  SimpleGrid, FormControl, FormLabel, Slider, SliderTrack, SliderFilledTrack, SliderThumb,
} from '@chakra-ui/react';
import { ChatMessage, ScenarioModification, ForecastAssumptions } from '../hooks/useForecasting';

// --- Helper component for a single assumption slider ---
interface AssumptionSliderProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  displayTransform?: (value: number) => string;
  min: number;
  max: number;
  step: number;
}

const AssumptionControl: React.FC<AssumptionSliderProps> = ({
  label,
  value,
  onChange,
  displayTransform = (v) => v.toFixed(2),
  min,
  max,
  step,
}) => (
  <FormControl>
    <FormLabel fontSize="sm" mb={1}>{label}</FormLabel>
    <SimpleGrid columns={2} spacing={2} alignItems="center">
      <Slider
        aria-label={label}
        value={value}
        onChange={onChange}
        min={min}
        max={max}
        step={step}
      >
        <SliderTrack>
          <SliderFilledTrack />
        </SliderTrack>
        <SliderThumb />
      </Slider>
      <NumberInput
        size="sm"
        value={displayTransform(value)}
        onChange={(_, valNum) => onChange(isNaN(valNum) ? 0 : valNum)}
        min={min}
        max={max}
        step={step}
      >
        <NumberInputField readOnly />
      </NumberInput>
    </SimpleGrid>
  </FormControl>
);


// --- Main Modal Component ---
export interface AssumptionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  isLoading: boolean;
  messages: ChatMessage[];
  activeModifications: ScenarioModification[];
  assumptions: ForecastAssumptions | null;
  onSendMessage: (text: string) => void;
  onUpdateAssumption: <C extends keyof ForecastAssumptions, K extends keyof ForecastAssumptions[C]>(
    category: C,
    key: K,
    value: ForecastAssumptions[C][K]
  ) => void;
  onApply: () => void;
  onUpdateModification: (id: string, value: number) => void;
}

export const AssumptionsModal: React.FC<AssumptionsModalProps> = ({
  isOpen,
  onClose,
  isLoading,
  messages,
  activeModifications,
  assumptions,
  onSendMessage,
  onUpdateAssumption,
  onApply,
  onUpdateModification,
}) => {
  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const handleSend = () => {
    if (inputText.trim()) {
      onSendMessage(inputText);
      setInputText('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const renderActiveModifications = () => (
    <VStack spacing={4} align="stretch" mt={4}>
      <Heading size="xs">Active Scenario:</Heading>
      {activeModifications.map(mod => (
        <Box key={mod.id} p={3} borderWidth="1px" borderRadius="md">
            <AssumptionControl
                label={mod.descriptionTemplate(mod.parameter.value)}
                value={mod.parameter.value}
                onChange={(v) => onUpdateModification(mod.id, v)}
                min={mod.parameter.min}
                max={mod.parameter.max}
                step={mod.parameter.step}
                displayTransform={(v) => mod.parameter.unit === '$' ? `$${v.toLocaleString()}` : `${v.toFixed(2)}%`}
            />
            <Text fontSize="xs" color="gray.500" mt={1}>{mod.explanation}</Text>
        </Box>
      ))}
    </VStack>
  );

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="2xl" scrollBehavior="inside">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>AI-Powered Forecasting</ModalHeader>
        <ModalCloseButton />
        <ModalBody pb={6}>
          <Tabs>
            <TabList>
              <Tab>Conversational AI</Tab>
              <Tab>Core Model Assumptions</Tab>
            </TabList>
            <TabPanels>
              <TabPanel>
                <VStack spacing={4} align="stretch">
                  <Box
                    h="300px"
                    overflowY="auto"
                    borderWidth="1px"
                    borderRadius="md"
                    p={3}
                  >
                    <VStack spacing={4} align="stretch">
                      {messages.map((msg) => (
                        <Box
                          key={msg.id}
                          alignSelf={msg.sender === 'user' ? 'flex-end' : 'flex-start'}
                          bg={msg.sender === 'user' ? 'blue.100' : 'gray.100'}
                          borderRadius="lg"
                          px={3}
                          py={2}
                          maxWidth="80%"
                        >
                          <Text>{msg.text}</Text>
                        </Box>
                      ))}
                      {isLoading && (
                        <Box alignSelf="flex-start">
                          <Spinner size="sm" />
                        </Box>
                      )}
                      <div ref={messagesEndRef} />
                    </VStack>
                  </Box>

                  {activeModifications.length > 0 && renderActiveModifications()}

                  <Textarea
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="e.g., Hire a new cook in July"
                    isDisabled={isLoading || activeModifications.length > 0}
                  />
                  <Button
                    onClick={handleSend}
                    isLoading={isLoading}
                    colorScheme="blue"
                    isDisabled={activeModifications.length > 0}
                  >
                    Send
                  </Button>
                </VStack>
              </TabPanel>
              <TabPanel>
                {assumptions ? (
                  <VStack spacing={6} align="stretch">
                    <Box>
                      <Heading size="sm" mb={3}>Monthly Revenue Growth ($)</Heading>
                      <SimpleGrid columns={2} spacing={4}>
                         <AssumptionControl label="In-Store" value={assumptions.revenueGrowth.inStoreSlope} onChange={v => onUpdateAssumption('revenueGrowth', 'inStoreSlope', v)} min={-1000} max={10000} step={100} displayTransform={v => `$${v.toFixed(0)}`} />
                         <AssumptionControl label="Delivery" value={assumptions.revenueGrowth.deliverySlope} onChange={v => onUpdateAssumption('revenueGrowth', 'deliverySlope', v)} min={-1000} max={10000} step={100} displayTransform={v => `$${v.toFixed(0)}`} />
                         <AssumptionControl label="Catering" value={assumptions.revenueGrowth.cateringSlope} onChange={v => onUpdateAssumption('revenueGrowth', 'cateringSlope', v)} min={-1000} max={10000} step={100} displayTransform={v => `$${v.toFixed(0)}`} />
                      </SimpleGrid>
                    </Box>
                    <Box>
                      <Heading size="sm" mb={3}>Cost of Goods Sold (as % of Revenue)</Heading>
                      <SimpleGrid columns={2} spacing={4}>
                         <AssumptionControl label="Food Cost" value={assumptions.costRatios.cogsFood * 100} onChange={v => onUpdateAssumption('costRatios', 'cogsFood', v/100)} min={0} max={100} step={0.5} displayTransform={v => `${v.toFixed(1)}%`} />
                         <AssumptionControl label="Beverage Cost" value={assumptions.costRatios.cogsBeverages * 100} onChange={v => onUpdateAssumption('costRatios', 'cogsBeverages', v/100)} min={0} max={100} step={0.5} displayTransform={v => `${v.toFixed(1)}%`} />
                      </SimpleGrid>
                    </Box>
                    <Box>
                        <Heading size="sm" mb={3}>Variable Operating Expenses (as % of Revenue)</Heading>
                        <SimpleGrid columns={2} spacing={4}>
                            <AssumptionControl label="Wages" value={assumptions.costRatios.laborWages * 100} onChange={v => onUpdateAssumption('costRatios', 'laborWages', v/100)} min={0} max={100} step={0.5} displayTransform={v => `${v.toFixed(1)}%`} />
                            <AssumptionControl label="Marketing" value={assumptions.costRatios.marketing * 100} onChange={v => onUpdateAssumption('costRatios', 'marketing', v/100)} min={0} max={100} step={0.5} displayTransform={v => `${v.toFixed(1)}%`} />
                            <AssumptionControl label="Delivery Commissions" value={assumptions.costRatios.gaDeliveryCommissions * 100} onChange={v => onUpdateAssumption('costRatios', 'gaDeliveryCommissions', v/100)} min={0} max={100} step={0.5} displayTransform={v => `${v.toFixed(1)}%`} />
                        </SimpleGrid>
                    </Box>
                    <Box>
                        <Heading size="sm" mb={3}>Fixed Monthly Operating Expenses ($)</Heading>
                        <SimpleGrid columns={2} spacing={4}>
                            <AssumptionControl label="Salaries" value={assumptions.fixedCosts.salaries} onChange={v => onUpdateAssumption('fixedCosts', 'salaries', v)} min={0} max={100000} step={500} displayTransform={v => `$${v.toFixed(0)}`} />
                            <AssumptionControl label="Rent" value={assumptions.fixedCosts.rent} onChange={v => onUpdateAssumption('fixedCosts', 'rent', v)} min={0} max={50000} step={250} displayTransform={v => `$${v.toFixed(0)}`} />
                            <AssumptionControl label="Utilities" value={assumptions.fixedCosts.utilities} onChange={v => onUpdateAssumption('fixedCosts', 'utilities', v)} min={0} max={10000} step={100} displayTransform={v => `$${v.toFixed(0)}`} />
                            <AssumptionControl label="Insurance" value={assumptions.fixedCosts.gaInsurance} onChange={v => onUpdateAssumption('fixedCosts', 'gaInsurance', v)} min={0} max={10000} step={50} displayTransform={v => `$${v.toFixed(0)}`} />
                        </SimpleGrid>
                    </Box>
                  </VStack>
                ) : (
                  <Text>No assumption data available. Please run a forecast first.</Text>
                )}
              </TabPanel>
            </TabPanels>
          </Tabs>
        </ModalBody>
        <ModalFooter>
          <Button variant="ghost" mr={3} onClick={onClose}>
            Cancel
          </Button>
          <Button colorScheme="blue" onClick={onApply} isDisabled={isLoading}>
            Apply Forecast
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default AssumptionsModal;