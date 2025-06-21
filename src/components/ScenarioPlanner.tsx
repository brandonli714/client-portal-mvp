// src/components/ScenarioPlanner.tsx
import React, { useState } from 'react';
import { Box, Heading, Input, Button, HStack, Text } from '@chakra-ui/react';

interface ScenarioPlannerProps {
  onAnalyze: (text: string) => void;
  isPlanning: boolean;
  onClear: () => void;
}

export const ScenarioPlanner: React.FC<ScenarioPlannerProps> = ({ onAnalyze, isPlanning, onClear }) => {
  const [text, setText] = useState('');

  const handleAnalyzeClick = () => {
    if (text.trim()) {
      onAnalyze(text.trim());
    }
  };

  if (isPlanning) {
    return (
        <Box p={5} bg="white" borderRadius="lg" boxShadow="sm">
            <HStack justify="space-between">
                <Text fontWeight="bold" color="blue.600">Currently viewing a forecast scenario.</Text>
                <Button colorScheme="gray" onClick={onClear}>Clear Forecast</Button>
            </HStack>
        </Box>
    )
  }

  return (
    <Box p={5} bg="white" borderRadius="lg" boxShadow="sm">
      <Heading size="md" mb={3}>
        Create a Forecast Scenario
      </Heading>
      <Text color="gray.600" mb={4}>
        Describe a change you want to model. For example: "Hire 2 new cooks" or "increase food costs by 5%".
      </Text>
      <HStack>
        <Input 
          placeholder="What if..." 
          value={text} 
          onChange={(e) => setText(e.target.value)}
        />
        <Button colorScheme="blue" onClick={handleAnalyzeClick}>
          Analyze
        </Button>
      </HStack>
    </Box>
  );
};