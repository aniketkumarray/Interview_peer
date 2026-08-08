const fs = require('fs');
const path = require('path');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const envPath = path.join(__dirname, '..', '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const match = envContent.match(/GEMINI_API_KEY=(.*)/);
const apiKey = match ? match[1].trim() : '';

async function testLiteModels() {
  // Lowest cost models in Google Gemini API
  const liteModels = ['gemini-2.0-flash-lite', 'gemini-2.5-flash-lite', 'gemini-flash-lite-latest', 'gemini-2.5-flash'];

  for (const modelName of liteModels) {
    try {
      console.log(`\nTesting low-cost model: ${modelName}...`);
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: modelName });

      const result = await model.generateContent({
        contents: [{ role: 'user', parts: [{ text: 'Respond with JSON array of 4 interview questions: ["q1", "q2", "q3", "q4"]' }] }],
      });

      console.log(`SUCCESS with ${modelName}! Response:`, result.response.text());
    } catch (err) {
      console.error(`FAILED with ${modelName}:`, err.message || err);
    }
  }
}

testLiteModels();
