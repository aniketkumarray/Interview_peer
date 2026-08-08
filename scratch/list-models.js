const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '..', '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const match = envContent.match(/GEMINI_API_KEY=(.*)/);
const apiKey = match ? match[1].trim() : '';

async function listAvailableModels() {
  console.log("Fetching available models for API key...");
  
  // Test v1beta endpoint for listModels
  const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;
  try {
    const response = await fetch(url);
    const data = await response.json();
    if (data.models) {
      console.log("AVAILABLE MODELS:");
      data.models.forEach(m => console.log(` - ${m.name}`));
    } else {
      console.log("Response:", JSON.stringify(data, null, 2));
    }
  } catch (err) {
    console.error("Error listing models:", err);
  }
}

listAvailableModels();
