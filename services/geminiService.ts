import { GoogleGenAI } from "@google/genai";
import { ChatMessage } from "../types";

// Note: GoogleGenAI instance is now created within functions to ensure the most up-to-date API key is used.

export const summarizeModule = async (moduleContent: string): Promise<string> => {
  try {
    // Fixed: Create a new GoogleGenAI instance right before making an API call to ensure fresh configuration
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Summarize the following educational module content into 3 key bullet points for a student: \n\n${moduleContent}`,
    });
    return response.text || "Could not generate summary.";
  } catch (error) {
    console.error("Gemini summary error:", error);
    return "Error generating summary.";
  }
};

/**
 * Fixed: Implemented chatWithAssistant using ai.models.generateContent for robust context management.
 * Uses gemini-3-pro-preview for advanced reasoning on university material.
 */
export const chatWithAssistant = async (history: ChatMessage[], userInput: string, context: string): Promise<string> => {
  try {
    // Fixed: Create a new GoogleGenAI instance right before making an API call
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    // Fixed: Using ai.models.generateContent with full conversation contents for history management
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: [
        ...history.map(m => ({
          role: m.role,
          parts: [{ text: m.text }]
        })),
        { role: 'user', parts: [{ text: userInput }] }
      ],
      config: {
        systemInstruction: `You are a helpful university study assistant. Use the following module context to help the student understand the material. If the answer isn't in the context, use your general knowledge but prioritize module accuracy. \n\nCONTEXT: ${context}`,
      },
    });

    return response.text || "I'm sorry, I couldn't generate a response.";
  } catch (error) {
    console.error("Gemini chat error:", error);
    return "The study assistant is currently unavailable. Please try again later.";
  }
};