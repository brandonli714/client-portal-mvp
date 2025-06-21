import {
  ChakraProvider,
  Box,
  Heading,
  extendTheme
} from '@chakra-ui/react';
import ForecastTool from './components/ForecastTool';

// Create a theme instance
const theme = extendTheme();

export const App = () => (
  <ChakraProvider theme={theme}>
    <Box p={5}>
      <Heading mb={5}>Client Dashboard</Heading>
      <ForecastTool />
    </Box>
  </ChakraProvider>
);