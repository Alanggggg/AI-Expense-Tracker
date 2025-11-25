import { describe, it, expect, vi, beforeEach } from 'vitest';
import { parseTransactionWithGemini } from '../geminiService';
import { GoogleGenAI } from '@google/genai';

describe('geminiService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should parse valid JSON response correctly', async () => {
    // 1. Setup Mock Response
    const mockResponseText = JSON.stringify({
      amount: 50,
      category: 'Food',
      note: 'Lunch',
      date: '2023-10-01T12:00:00.000Z',
      type: 'Expense'
    });

    const generateContentMock = vi.fn().mockResolvedValue({
      text: mockResponseText
    });

    // Mock the instance method
    (GoogleGenAI as any).mockImplementation(() => ({
      models: {
        generateContent: generateContentMock
      }
    }));

    // 2. Execute
    const result = await parseTransactionWithGemini('Lunch 50', ['Food']);

    // 3. Assert
    expect(result).toEqual({
      amount: 50,
      category: 'Food',
      note: 'Lunch',
      date: '2023-10-01T12:00:00.000Z',
      type: 'Expense'
    });
    expect(generateContentMock).toHaveBeenCalled();
  });

  it('should throw an error if API returns empty text', async () => {
    const generateContentMock = vi.fn().mockResolvedValue({
      text: null 
    });

    (GoogleGenAI as any).mockImplementation(() => ({
      models: {
        generateContent: generateContentMock
      }
    }));

    await expect(parseTransactionWithGemini('Bad input', [])).rejects.toThrow('Failed to process your request');
  });

  it('should handle JSON parse errors gracefully', async () => {
    const generateContentMock = vi.fn().mockResolvedValue({
      text: "Not valid JSON" 
    });

    (GoogleGenAI as any).mockImplementation(() => ({
      models: {
        generateContent: generateContentMock
      }
    }));

    await expect(parseTransactionWithGemini('input', [])).rejects.toThrow();
  });
});
