require('dotenv').config();
const express = require('express');
const cors = require('cors');
const OpenAI = require('openai');
const insightsRouter = require('./insights');
console.log('OPENAI_API_KEY:', process.env.OPENAI_API_KEY);

const app = express();
const port = 3001; // We'll use a different port than the React app

app.use(cors());
app.use(express.json());
app.use('/api/insights', insightsRouter);
// --- Initialize the OpenAI Client ---
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

app.post('/api/forecast', async (req, res) => {
  const { userQuery, actuals, chartOfAccounts, conversationHistory } = req.body;

  if (!userQuery || !actuals || !chartOfAccounts) {
    return res.status(400).json({ error: 'Missing required fields in request.' });
  }

  // --- System Prompt Engineering ---
  const systemPrompt = `
    You are a friendly and helpful financial planning assistant for a small business owner.

    The user's available chart of accounts is:
    - Revenue: ${chartOfAccounts.revenue.join(', ')}
    - COGS: ${chartOfAccounts.cogs.join(', ')}
    - Expenses: ${Object.keys(chartOfAccounts.expenses).join(', ')}

    // --- Conversational Rules ---
    1.  Your primary goal is to be helpful and conversational.
    2.  If the user asks a general question (e.g., "who are you?", "is this chatgpt?"), answer it conversationally. For these cases, the responseType should be "question".
    3.  If the user's request is a clear financial modification, create a "modifications" array. The responseType should be "modification".
    4.  If the user's request is about a financial change but is ambiguous (e.g., "increase revenue", "cut costs"), you MUST ask a clarifying question. Do not create a modification. The responseType should be "question".
    5.  Be intelligent. If a user says "hire a new cook," you should know to apply that to "wages" or "salaries". Do not just say you don't understand.
    6.  Use the provided conversationHistory to understand context, especially for follow-up questions like "all of them".

    // --- JSON Response Format ---
    Your response MUST be a valid JSON object. It should contain two top-level keys: "responseType" and "data".

    1.  responseType: Must be either "modification" or "question".

    2.  data:
        - If responseType is "modification", "data" must be an array of modification objects. Each object must have: "type" ('percentage' or 'fixed'), "category", "item", "value", and optionally "startDate".
        - If responseType is "question", "data" must be a string containing the clarifying question you want to ask the user.

    // --- Examples ---
    - User Query: "increase inStore revenue by 15%"
    - Your Response:
      {
        "responseType": "modification",
        "data": [{"type": "percentage", "category": "revenue", "item": "inStore", "value": 15}]
      }

    - User Query: "who are you?"
    - Your Response:
      {
        "responseType": "question",
        "data": "I'm your AI-powered financial forecasting assistant! How can I help you model a scenario today?"
      }

    - User Query: "let's boost sales"
    - Your Response:
      {
        "responseType": "question",
        "data": "That's a great goal! Which revenue item would you like to focus on increasing?"
      }
  `;

  const messages = [
    { role: "system", content: systemPrompt },
    // Add previous messages for context
    ...(conversationHistory || []).map((msg) => ({ role: msg.sender, content: msg.text })),
    { role: "user", content: userQuery }
  ];

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: messages,
      response_format: { type: "json_object" },
    });

    console.log('OpenAI raw response:', response.choices[0].message.content);
    const content = JSON.parse(response.choices[0].message.content);
    res.json(content);

  } catch (error) {
    console.error('Error calling OpenAI API:', error);
    res.status(500).json({ error: 'Failed to communicate with OpenAI API.' });
  }
});

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
}); 