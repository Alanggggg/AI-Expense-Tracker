import { GoogleGenAI, Type } from "@google/genai";
import { TransactionCategory, TransactionType } from "../types";

// Initialize the client
// Note: In a real production app, this key should be proxied or handled securely.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export interface ParsedTransactionData {
  amount: number;
  category: TransactionCategory;
  note: string;
  date: string;
  type: TransactionType;
}

export const parseTransactionWithGemini = async (input: string): Promise<ParsedTransactionData> => {
  const now = new Date();
  const systemInstruction = `
    You are an intelligent financial assistant. Your job is to parse natural language text (in English, Chinese, or other languages) into a structured transaction object.
    
    Current Date: ${now.toISOString()}
    
    Rules:
    1. Analyze the user's input to extract the amount, category, note, date, and transaction type.
    2. If the currency is not specified, assume it is the user's local currency (extract only the number).
    3. Map the category to one of these exactly based on the meaning:
       - 'Food' (e.g., lunch, dinner, groceries, 吃饭, 咖啡, 超市)
       - 'Transport' (e.g., taxi, bus, gas, flight, 打车, 地铁, 加油)
       - 'Shopping' (e.g., clothes, electronics, gadgets, 买衣服, 购物)
       - 'Entertainment' (e.g., movies, games, party, 电影, 游戏, 娱乐)
       - 'Housing' (e.g., rent, utilities, furniture, 房租, 水电费)
       - 'Others' (general or unknown)
    4. If the category is ambiguous, default to 'Others'.
    5. If the date is not specified (e.g. "spent 50 on lunch"), use the Current Date provided above.
    6. If the text implies earning money (e.g. "salary", "bonus", "sold item", 工资, 奖金, 卖二手), set type to 'Income'. Otherwise 'Expense'.
    7. Keep the 'note' concise and in the same language as the input if possible.
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
            amount: { type: Type.NUMBER, description: "The numeric value of the transaction." },
            category: { 
              type: Type.STRING, 
              enum: Object.values(TransactionCategory),
              description: "The category of the transaction." 
            },
            note: { type: Type.STRING, description: "A short description of the transaction." },
            date: { type: Type.STRING, description: "ISO 8601 date string of when the transaction occurred." },
            type: { 
              type: Type.STRING, 
              enum: Object.values(TransactionType),
              description: "Whether this is an Expense or Income." 
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