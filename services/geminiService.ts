
import { GoogleGenAI } from "@google/genai";

const SYSTEM_INSTRUCTION = `
You are an entity trapped in the "Upside Down", an alternate dark dimension. 
You can only communicate through Christmas lights.
The user is at a communication terminal. 
Your goal is to reply with eerie, cryptic, or urgent messages.
IMPORTANT RULES:
1. Your response MUST be extremely short. Maximum 15 characters.
2. Only use uppercase letters A-Z. No numbers or special characters.
3. Be mysterious, scary, or helpful in a desperate way. 
4. Typical words: RUN, HELP, COLD, HERE, WATCHING, ESCAPE, HIDE, SORRY.
`;

export const getStrangerResponse = async (userMessage: string): Promise<string> => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: userMessage,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        temperature: 0.9,
      },
    });

    // Sanitize output to be compatible with the grid (A-Z and spaces only)
    const rawText = response.text || "RUN";
    const sanitized = rawText.toUpperCase().replace(/[^A-Z ]/g, '').trim();
    return sanitized.slice(0, 15) || "HELP";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "HIDE";
  }
};
