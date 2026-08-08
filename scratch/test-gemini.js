const fs = require('fs');
const path = require('path');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const envPath = path.join(__dirname, '..', '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const match = envContent.match(/GEMINI_API_KEY=(.*)/);
const apiKey = match ? match[1].trim() : '';

async function testGemini() {
  const modelsToTry = ['gemini-2.5-flash', 'gemini-2.0-flash-001', 'gemini-flash-latest', 'gemini-3.6-flash'];

  for (const modelName of modelsToTry) {
    try {
      console.log(`\nTesting model: ${modelName}...`);
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: modelName });

      const result = await model.generateContent({
        contents: [{ role: 'user', parts: [{ text: 'Respond with JSON array of 4 interview questions: ["q1", "q2", "q3", "q4"]' }] }],
      });

      console.log(`SUCCESS with ${modelName}! Response:`, result.response.text());
      return;
    } catch (err) {
      console.error(`FAILED with ${modelName}:`, err.message || err);
    }
  }
}

testGemini();
