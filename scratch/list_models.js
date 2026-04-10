import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
dotenv.config();

async function listModels() {
  const apiKey = process.env.VITE_GEMINI_API_KEY;
  if (!apiKey) {
    console.error('No VITE_GEMINI_API_KEY found in .env');
    return;
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1/models?key=${apiKey}`);
    const data = await response.json();
    console.log('Available Models:', JSON.stringify(data.models.map(m => m.name), null, 2));
  } catch (error) {
    console.error('Error listing models:', error);
  }
}

listModels();
