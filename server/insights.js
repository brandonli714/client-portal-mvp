const express = require('express');
const router = express.Router();
const OpenAI = require('openai');
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

router.post('/', async (req, res) => {
  const { actuals } = req.body;
  const prompt = `
You are a financial analyst. Here is a company's monthly financial data (actuals):

${JSON.stringify(actuals)}

Please provide 3-5 actionable business insights, such as:
- Areas where the company is underperforming vs. industry benchmarks (e.g., gross margin, net margin, expense ratios).
- Notable trends or correlations (e.g., marketing spend vs. revenue growth).
- Suggestions for improvement.

Be specific and use numbers from the data where possible.
`;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 500,
      temperature: 0.7,
    });
    const insights = completion.choices[0].message.content.trim();
    res.json({ insights });
  } catch (err) {
    console.error(err);
    res.status(500).json({ insights: "Sorry, I couldn't generate insights at this time." });
  }
});

module.exports = router;