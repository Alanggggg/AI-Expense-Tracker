
import { GoogleGenAI, Type } from "@google/genai";
import { TransactionCategory, TransactionType } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export interface ParsedTransactionData {
  amount: number;
  category: string;
  note: string;
  date: string;
  type: TransactionType;
}

export const parseTransactionWithGemini = async (input: string, existingCategories: string[]): Promise<ParsedTransactionData> => {
  const now = new Date();
  const categoriesList = existingCategories.join(', ');
  
  const systemInstruction = `
    You are an intelligent financial assistant. Your job is to parse natural language text into a structured transaction object.
    
    Current Date: ${now.toISOString()}
    Existing Categories: ${categoriesList}
    
    Rules:
    1. Extract amount, category, note, date, and transaction type.
    2. CATEGORY MATCHING (Important): 
       - First, try to fit the transaction into one of the 'Existing Categories' listed above if the meaning matches closely.
       - If the transaction represents a CLEARLY different concept that doesn't fit any existing category, CREATE A NEW CATEGORY name.
       - New category names should be short (1-2 words), Capitalized (e.g., "Pets", "Education", "Travel"), and in English.
    3. If currency is not specified, assume local currency (extract number only).
    4. If date is not specified, use Current Date.
    5. Type: 'Income' for earnings (salary, bonus), 'Expense' for spending.
    6. Keep 'note' concise.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: input,
      config: {
        systemInstruction: systemInstruction,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            amount: { type: Type.NUMBER, description: "The numeric value." },
            category: { 
              type: Type.STRING, 
              description: "The category name. Use an existing one or create a new short name." 
            },
            note: { type: Type.STRING, description: "Short description." },
            date: { type: Type.STRING, description: "ISO 8601 date string." },
            type: { 
              type: Type.STRING, 
              enum: Object.values(TransactionType),
              description: "Expense or Income." 
            }
          },
          required: ["amount", "category", "note", "date", "type"],
        }
      }
    });

    if (response.text) {
      return JSON.parse(response.text) as ParsedTransactionData;
    }
    
    throw new Error("No text returned from Gemini");

  } catch (error) {
    console.error("Error parsing transaction with Gemini:", error);
    throw new Error("Failed to process your request. Please try again.");
  }
};
