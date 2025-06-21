// src/components/AssumptionsModal.tsx
import React, { useState, useEffect } from 'react';
import {
  Modal, ModalOverlay, ModalContent, ModalHeader, ModalFooter, ModalBody, ModalCloseButton, Button, VStack, Text, 
  CircularProgress, Box, Heading, Slider, SliderTrack, SliderFilledTrack, SliderThumb, Tooltip,
  Accordion, AccordionItem, AccordionButton, AccordionPanel, AccordionIcon,
} from '@chakra-ui/react';
import { InteractiveModification } from '../hooks/useForecasting';

interface AssumptionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  assumptions: InteractiveModification[];
  onApply: (approvedAssumptions: InteractiveModification[]) => void;
  isLoading: boolean;
}

// A single interactive assumption component
const AssumptionEditor: React.FC<{
  assumption: InteractiveModification;
  currentValue: number;
  onValueChange: (value: number) => void;
}> = ({ assumption, currentValue, onValueChange }) => {
  const [showTooltip, setShowTooltip] = useState(false);
  const { parameter } = assumption;

  return (
    <Box p={4} borderWidth={1} borderRadius="md" w="full">
      <VStack align="stretch" spacing={3}>
        <Text fontWeight="medium">
          {assumption.descriptionTemplate(parameter.unit === '$' ? Math.round(currentValue) : currentValue)}
        </Text>
        <Slider
          aria-label='assumption-slider'
          min={parameter.min}
          max={parameter.max}
          step={parameter.step}
          value={currentValue}
          onChange={onValueChange}
          onMouseEnter={() => setShowTooltip(true)}
          onMouseLeave={() => setShowTooltip(false)}
        >
          <SliderTrack>
            <SliderFilledTrack />
          </SliderTrack>
          <Tooltip
            hasArrow
            bg='blue.500'
            color='white'
            placement='top'
            isOpen={showTooltip}
            label={`${parameter.unit === '$' ? '$' : ''}${currentValue}${parameter.unit === '%' ? '%' : ''}`}
          >
            <SliderThumb />
          </Tooltip>
        </Slider>
        <Accordion allowToggle>
          <AccordionItem border="none">
            <h2>
              <AccordionButton _hover={{bg: 'gray.100'}} p={2}>
                <Box flex="1" textAlign="left" fontSize="sm" color="gray.600">
                  Show AI Explanation
                </Box>
                <AccordionIcon />
              </AccordionButton>
            </h2>
            <AccordionPanel pb={4} fontSize="sm" color="gray.700">
              {assumption.explanation}
            </AccordionPanel>
          </AccordionItem>
        </Accordion>
      </VStack>
    </Box>
  )
}

// The main modal component
export const AssumptionsModal: React.FC<AssumptionsModalProps> = ({ isOpen, onClose, assumptions, onApply, isLoading }) => {
  const [currentValues, setCurrentValues] = useState<Record<string, number>>({});

  useEffect(() => {
    if (isOpen) {
      const initialValues: Record<string, number> = {};
      assumptions.forEach(a => {
        initialValues[a.id] = a.parameter.value;
      });
      setCurrentValues(initialValues);
    }
  }, [isOpen, assumptions]);

  const handleApply = () => {
    const configuredAssumptions = assumptions.map(a => ({
      ...a,
      parameter: { ...a.parameter, value: currentValues[a.id] }
    }));
    onApply(configuredAssumptions);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl" scrollBehavior="inside">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Confirm & Adjust Assumptions</ModalHeader>
        <ModalCloseButton />
        <ModalBody pb={6}>
          {isLoading ? (
            <VStack justify="center" h="200px">
                <CircularProgress isIndeterminate color="blue.400" />
                <Text>Analyzing scenario...</Text>
            </VStack>
          ) : (
            <VStack spacing={4} align="stretch">
              <Box bg="blue.50" p={4} borderRadius="md">
                <Heading size="sm" mb={2}>Generated Assumptions</Heading>
                <Text fontSize="sm">Our AI has analyzed your request and generated the following assumptions. You can adjust the values before applying the forecast.</Text>
              </Box>
              {assumptions.length > 0 ? assumptions.map((assumption) => (
                <AssumptionEditor 
                  key={assumption.id}
                  assumption={assumption}
                  currentValue={currentValues[assumption.id] || 0}
                  onValueChange={(val) => setCurrentValues(prev => ({...prev, [assumption.id]: val}))}
                />
              )) : (
                <Text color="gray.500" pt={4}>The AI could not identify any specific changes from your request. Please try rephrasing.</Text>
              )}
            </VStack>
          )}
        </ModalBody>
        <ModalFooter>
          <Button variant="ghost" mr={3} onClick={onClose}>
            Cancel
          </Button>
          <Button colorScheme="blue" onClick={handleApply} isDisabled={isLoading || assumptions.length === 0}>
            Apply Forecast
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};