import React from 'react';
import {
  Modal, ModalOverlay, ModalContent, ModalHeader, ModalFooter, ModalBody, ModalCloseButton,
  Button, VStack, Box, Text, HStack, Slider, SliderTrack, SliderFilledTrack, SliderThumb,
  CircularProgress, Center
} from '@chakra-ui/react';
import { InteractiveModification } from '../hooks/useForecasting'; // Import the type

// --- Define Props Interface ---
interface AssumptionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  isLoading: boolean;
  assumptions: InteractiveModification[];
  onApply: (assumptions: InteractiveModification[]) => void;
  onAssumptionChange: (id: string, value: number) => void;
}

export const AssumptionsModal: React.FC<AssumptionsModalProps> = ({
  isOpen,
  onClose,
  isLoading,
  assumptions,
  onApply,
  onAssumptionChange
}) => {

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Review & Adjust AI Assumptions</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          {isLoading ? (
            <Center h="200px">
              <VStack>
                <CircularProgress isIndeterminate color="blue.300" />
                <Text>AI is analyzing your request...</Text>
              </VStack>
            </Center>
          ) : (
            <VStack spacing={6} align="stretch">
              {assumptions.map((assumption) => (
                <Box key={assumption.id} p={4} borderWidth={1} borderRadius="md" >
                  <Text fontWeight="bold" mb={2}>
                    {assumption.descriptionTemplate(assumption.parameter.value)}
                  </Text>
                  <Text fontSize="sm" color="gray.600" mb={3}>
                    {assumption.explanation}
                  </Text>
                  <HStack>
                    <Text w="120px" fontSize="sm" color="gray.500">{assumption.parameter.min.toLocaleString()}</Text>
                    <Slider
                      value={assumption.parameter.value}
                      onChange={(value) => onAssumptionChange(assumption.id, value)}
                      min={assumption.parameter.min}
                      max={assumption.parameter.max}
                      step={assumption.parameter.step}
                    >
                      <SliderTrack>
                        <SliderFilledTrack />
                      </SliderTrack>
                      <SliderThumb />
                    </Slider>
                    <Text w="120px" fontSize="sm" color="gray.500">{assumption.parameter.max.toLocaleString()}</Text>
                  </HStack>
                </Box>
              ))}
            </VStack>
          )}
        </ModalBody>

        <ModalFooter>
          <Button variant="ghost" mr={3} onClick={onClose}>
            Cancel
          </Button>
          <Button colorScheme="blue" onClick={() => onApply(assumptions)} isDisabled={isLoading}>
            Apply & Re-run Forecast
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default AssumptionsModal;