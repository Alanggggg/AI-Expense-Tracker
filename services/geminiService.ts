
import { GoogleGenAI, Type } from "@google/genai";
import { TransactionCategory, TransactionType, Transaction } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export interface GeminiResponse {
  action: 'RECORD' | 'ANSWER';
  transaction?: {
    amount: number;
    category: string;
    // We intentionally do not ask AI for subcategory as per requirements
    note: string;
    date: string;
    type: TransactionType;
  };
  answerText?: string;
}

const RESPONSE_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    action: { 
      type: Type.STRING, 
      enum: ['RECORD', 'ANSWER'],
      description: "Determine if user wants to RECORD a transaction or ASK a question." 
    },
    // Fields for RECORD action
    amount: { type: Type.NUMBER, nullable: true },
    category: { type: Type.STRING, nullable: true },
    note: { type: Type.STRING, nullable: true },
    date: { type: Type.STRING, nullable: true },
    type: { type: Type.STRING, enum: ['Expense', 'Income'], nullable: true },
    // Fields for ANSWER action
    answerText: { 
      type: Type.STRING, 
      nullable: true, 
      description: "The answer to the user's question based on provided context." 
    }
  },
  required: ["action"],
};

export const parseTransactionWithGemini = async (
  input: string, 
  existingCategories: string[], 
  history: Transaction[] = []
): Promise<GeminiResponse> => {
  const now = new Date();
  const categoriesList = existingCategories.join(', ');
  
  // Inject Subcategory into context (e.g., "Transport/Taxi")
  const historyContext = history
    .slice(0, 50)
    .map(t => {
      const catDisplay = t.subcategory ? `${t.category}/${t.subcategory}` : t.category;
      return `${t.date.split('T')[0]}, ${catDisplay}, ${t.type === 'Expense' ? '-' : '+'}${t.amount}, ${t.note}`;
    })
    .join('\n');

  const systemInstruction = `
    Role: Financial Assistant.
    Current Date: ${now.toISOString()}
    Existing Top-Level Categories: ${categoriesList}

    Context Data (Recent Transactions CSV Format):
    Date, Category/Subcategory, Amount, Note
    ----------------------------------------
    ${historyContext}
    
    Task: Analyze user input and decide Action:
    1. RECORD: User wants to add a transaction.
       - Extract amount, category, note, date.
       - RULE: ONLY classify into a Main Category (Level 1). Do not create subcategories.
       - Match existing category if possible. If not, create a NEW Title Case category.
       - Default to current date if missing.
    
    2. ANSWER: User asks a question about spending.
       - Analyze "Context Data" (Pay attention to Subcategories like Transport/Taxi).
       - Return result in 'answerText'.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-flash-lite-latest',
      contents: input,
      config: {
        systemInstruction: systemInstruction,
        responseMimeType: 'application/json',
        maxOutputTokens: 500, 
        responseSchema: RESPONSE_SCHEMA
      }
    });

    if (response.text) {
      const result = JSON.parse(response.text);
      
      if (result.action === 'RECORD') {
        return {
          action: 'RECORD',
          transaction: {
            amount: result.amount,
            category: result.category || 'Uncategorized',
            note: result.note || 'Expense',
            date: result.date || now.toISOString(),
            type: result.type || 'Expense'
          }
        };
      } else {
        return {
          action: 'ANSWER',
          answerText: result.answerText || "I couldn't find an answer in your data."
        };
      }
    }
    
    throw new Error("No response from AI");

  } catch (error) {
    console.error("Gemini Error:", error);
    throw new Error("Failed to process request.");
  }
};

export const parseImageTransactionWithGemini = async (base64Data: string, mimeType: string, existingCategories: string[]): Promise<GeminiResponse> => {
  const now = new Date();
  const categoriesList = existingCategories.join(', ');

  const systemInstruction = `
    Analyze receipt/image.
    Current Date: ${now.toISOString()}
    Categories: ${categoriesList}

    Rules:
    1. Extract total amount, merchant (note), category, date.
    2. Match Main Category (Level 1) only.
    3. Default to 'Expense'.
  `;

  const IMAGE_SCHEMA = {
    type: Type.OBJECT,
    properties: {
      amount: { type: Type.NUMBER },
      category: { type: Type.STRING },
      note: { type: Type.STRING },
      date: { type: Type.STRING },
      type: { type: Type.STRING, enum: ['Expense', 'Income'] }
    },
    required: ["amount", "category", "note", "date", "type"]
  };

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: {
        parts: [
          { inlineData: { data: base64Data, mimeType: mimeType } },
          { text: "Analyze this receipt." }
        ]
      },
      config: {
        systemInstruction: systemInstruction,
        responseMimeType: 'application/json',
        responseSchema: IMAGE_SCHEMA
      }
    });

    if (response.text) {
      const data = JSON.parse(response.text);
      return {
        action: 'RECORD',
        transaction: data
      };
    }
    
    throw new Error("No text returned from Gemini");

  } catch (error) {
    console.error("Error parsing image with Gemini:", error);
    throw new Error("Failed to analyze image.");
  }
};
