import { GoogleGenAI } from "@google/genai";

// Initialize Gemini
// NOTE: The API key must be obtained exclusively from the environment variable process.env.API_KEY.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generateConciergeResponse = async (userQuery: string): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: userQuery,
      config: {
        systemInstruction: "You are Aura, an ultra-premium ride sharing AI concierge. You are concise, polite, and futuristic. Keep responses under 50 words.",
      }
    });

    return response.text || "I'm having trouble connecting to the neural network.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Connection interrupted. Please try again.";
  }
};