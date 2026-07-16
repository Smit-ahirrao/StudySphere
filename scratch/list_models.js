import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = "AIzaSyCM-DGCD9A34JVKNFXbnWT0ANsPqB7V4rE";
const genAI = new GoogleGenerativeAI(apiKey);

async function listModels() {
  try {
    const models = await genAI.listModels();
    console.log("Available models:");
    models.models.forEach((m) => {
      console.log(`- ${m.name} (Methods: ${m.supportedMethods.join(", ")})`);
    });
  } catch (err) {
    console.error("Error listing models:", err);
  }
}

listModels();
