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

const COMMON_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    amount: { type: Type.NUMBER, description: "Value" },
    category: { 
      type: Type.STRING, 
      description: "Category name" 
    },
    note: { type: Type.STRING, description: "Merchant name or item description" },
    date: { type: Type.STRING, description: "ISO date" },
    type: { 
      type: Type.STRING, 
      enum: Object.values(TransactionType),
      description: "Type" 
    }
  },
  required: ["amount", "category", "note", "date", "type"],
};

export const parseTransactionWithGemini = async (input: string, existingCategories: string[]): Promise<ParsedTransactionData> => {
  const now = new Date();
  const categoriesList = existingCategories.join(', ');
  
  // Optimized, concise instruction to reduce input tokens and processing time
  const systemInstruction = `
    Parse transaction to JSON.
    Date: ${now.toISOString()}
    Categories: ${categoriesList}
    
    Rules:
    1. Match existing category or create NEW (Short, Title Case).
    2. No currency? Assume number is amount.
    3. No date? Use Current Date.
    4. Type: 'Expense' or 'Income'.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-flash-lite-latest', // Optimized for speed/latency
      contents: input,
      config: {
        systemInstruction: systemInstruction,
        responseMimeType: 'application/json',
        maxOutputTokens: 300, // Limit output size to prevent latency spikes
        responseSchema: COMMON_SCHEMA
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

export const parseImageTransactionWithGemini = async (base64Data: string, mimeType: string, existingCategories: string[]): Promise<ParsedTransactionData> => {
  const now = new Date();
  const categoriesList = existingCategories.join(', ');

  const systemInstruction = `
    Analyze the image (receipt, invoice, or object) and extract transaction details.
    Current Date: ${now.toISOString()}
    Existing Categories: ${categoriesList}

    Rules:
    1. Amount: Extract the TOTAL amount.
    2. Note: Extract the Merchant Name (e.g., Starbucks, Walmart) or Item Name. Keep it short.
    3. Category: Infer from the items/merchant. Use existing categories if they fit, otherwise create a concise Title Case one.
    4. Date: Extract the date from the receipt. If missing, use Current Date.
    5. Type: Usually 'Expense'. Only 'Income' if it looks like a payslip or deposit slip.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash', // Stronger model for Multimodal/OCR tasks
      contents: {
        parts: [
          { inlineData: { data: base64Data, mimeType: mimeType } },
          { text: "Analyze this receipt." }
        ]
      },
      config: {
        systemInstruction: systemInstruction,
        responseMimeType: 'application/json',
        responseSchema: COMMON_SCHEMA
      }
    });

    if (response.text) {
      return JSON.parse(response.text) as ParsedTransactionData;
    }
    
    throw new Error("No text returned from Gemini");

  } catch (error) {
    console.error("Error parsing image with Gemini:", error);
    throw new Error("Failed to analyze image. Please try again.");
  }
};