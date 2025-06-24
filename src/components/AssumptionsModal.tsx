import React, { useState, useEffect, useRef } from 'react';
import {
  Modal, ModalOverlay, ModalContent, ModalHeader, ModalFooter, ModalBody, ModalCloseButton,
  Button, VStack, Box, Text, HStack,
  CircularProgress, Input, Divider
} from '@chakra-ui/react';
import { Message } from '../hooks/useForecasting';

// --- Self-Contained Type for Modifications ---
// This is defined locally to prevent compiler errors from stale imports.
interface LocalModification {
  id: string;
  type: 'percentage' | 'fixed';
  category?: string;
  item?: string;
  value?: number;
  startDate?: string;
  description: string;
  [key: string]: any;
}

// --- Props for the main modal component ---
interface AssumptionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  isLoading: boolean;
  messages: Message[];
  activeModifications: LocalModification[];
  onSendMessage: (text: string) => void;
  onApply: () => void;
}

// --- Helper component to display a single modification ---
const AssumptionControl: React.FC<{ mod: LocalModification }> = ({ mod }) => {
  return (
    <Box w="100%" p={2}>
      <Text fontWeight="normal">{mod.description}</Text>
    </Box>
  );
};

// --- Main Modal Component (Corrected and Rewritten) ---
export const AssumptionsModal: React.FC<AssumptionsModalProps> = ({
  isOpen, onClose, isLoading, messages, activeModifications,
  onSendMessage, onApply
}) => {
  const [text, setText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(scrollToBottom, [messages]);

  const handleSend = () => {
    if (text.trim()) {
      onSendMessage(text);
      setText('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !isLoading) {
      handleSend();
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="2xl" scrollBehavior="inside">
      <ModalOverlay />
      <ModalContent mx={4}>
        <ModalHeader>AI-Assisted Forecast</ModalHeader>
        <ModalCloseButton />
        <ModalBody pb={6}>
          <VStack spacing={4} align="stretch">
            {/* Message History */}
            <Box h="300px" overflowY="auto" p={4} borderWidth={1} borderRadius="md" bg="gray.50">
              <VStack spacing={4} align="stretch">
                {messages.map((msg) => (
                  <HStack key={msg.id} justify={msg.sender === 'user' ? 'flex-end' : 'flex-start'}>
                    <Box
                      bg={msg.sender === 'user' ? 'blue.500' : 'gray.200'}
                      color={msg.sender === 'user' ? 'white' : 'black'}
                      px={4} py={2} borderRadius="lg" maxWidth="80%"
                    >
                      <Text>{msg.text}</Text>
                    </Box>
                  </HStack>
                ))}
                 {isLoading && (
                    <HStack justify='flex-start'>
                        <Box bg='gray.200' color='black' px={4} py={2} borderRadius="lg">
                            <CircularProgress isIndeterminate size="20px" />
                        </Box>
                    </HStack>
                )}
                <div ref={messagesEndRef} />
              </VStack>
            </Box>

            {/* Active Scenario Modifications */}
            {activeModifications.length > 0 && (
              <Box p={4} borderWidth={1} borderRadius="md" bg="blue.50">
                <Text fontWeight="bold" mb={3} fontSize="lg">Active Scenario</Text>
                <VStack spacing={2} divider={<Divider />}>
                  {activeModifications.map((mod) => (
                    <AssumptionControl key={mod.id} mod={mod} />
                  ))}
                </VStack>
              </Box>
            )}

            {/* Chat Input */}
            <HStack>
              <Input
                placeholder="Type your message..."
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyPress={handleKeyPress}
                isDisabled={isLoading}
              />
              <Button onClick={handleSend} colorScheme="blue" isDisabled={isLoading}>Send</Button>
            </HStack>
          </VStack>
        </ModalBody>

        <ModalFooter>
          <Button variant="ghost" mr={3} onClick={onClose}>Cancel</Button>
          <Button
            colorScheme="blue"
            onClick={onApply}
            isDisabled={isLoading || activeModifications.length === 0}
          >
            Apply Forecast
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default AssumptionsModal;