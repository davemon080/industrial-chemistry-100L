
import { GoogleGenAI } from "@google/genai";
import { ChatMessage } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const summarizeModule = async (moduleContent: string): Promise<string> => {
  try {
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
 * Fix: Implemented chatWithAssistant to handle multi-turn conversations with context.
 * Uses the latest Gemini 3 Flash model for efficient reasoning.
 */
export const chatWithAssistant = async (history: ChatMessage[], userInput: string, context: string): Promise<string> => {
  try {
    const chat = ai.chats.create({
      model: 'gemini-3-flash-preview',
      history: history.map(m => ({
        role: m.role,
        parts: [{ text: m.text }]
      })),
      config: {
        systemInstruction: `You are a helpful university study assistant. Use the following module context to help the student understand the material. If the answer isn't in the context, use your general knowledge but prioritize module accuracy. \n\nCONTEXT: ${context}`,
      },
    });

    const response = await chat.sendMessage({ message: userInput });
    return response.text || "I'm sorry, I couldn't generate a response.";
  } catch (error) {
    console.error("Gemini chat error:", error);
    return "The study assistant is currently unavailable. Please try again later.";
  }
};
