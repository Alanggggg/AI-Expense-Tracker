import React, { useState, useEffect } from 'react';
import { useExpenses } from '../context/ExpenseContext';
import { parseTransactionWithGemini } from '../services/geminiService';
import { ArrowUp, Loader2, Sparkles, Mic, MicOff } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

const SUGGESTIONS = [
  "☕️ 咖啡 25",
  "🚕 打车 30",
  "💰 发工资 8000",
  "🥗 午饭 30元"
];

// Type definition for Web Speech API
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

const SmartInput: React.FC = () => {
  const [input, setInput] = useState('');
  const { addTransaction, isLoading, setIsLoading } = useExpenses();
  const [error, setError] = useState<string | null>(null);
  
  // Voice Input State
  const [isListening, setIsListening] = useState(false);
  const [isSpeechSupported, setIsSpeechSupported] = useState(false);

  useEffect(() => {
    if ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window) {
      setIsSpeechSupported(true);
    }
  }, []);

  const startListening = () => {
    if (isLoading) return;
    
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    const recognition = new SpeechRecognition();
    recognition.lang = 'zh-CN'; // Default to Chinese for this user context
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = () => {
      setIsListening(true);
      setError(null);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      // Append to existing text or replace? Usually replace for short commands, 
      // but let's append if there's a trailing space, otherwise replace.
      setInput(transcript);
    };

    recognition.onerror = (event: any) => {
      console.error("Speech recognition error", event.error);
      setIsListening(false);
      setError("无法识别语音，请重试");
    };

    recognition.start();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    setIsLoading(true);
    setError(null);

    try {
      const data = await parseTransactionWithGemini(input);
      
      addTransaction({
        id: uuidv4(),
        amount: data.amount,
        category: data.category,
        note: data.note,
        date: data.date,
        type: data.type
      });

      setInput('');
    } catch (err) {
      setError("无法理解，请尝试：'午饭 30元'");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    // Updated padding-bottom: calc(1.5rem + env(safe-area-inset-bottom))
    // This ensures the input bar is pushed up above the iPhone Home Indicator
    <div className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-md border-t border-gray-200 z-50 px-4 pt-4 pb-[calc(1.5rem+env(safe-area-inset-bottom))]">
      <div className="max-w-md mx-auto relative">
        {error && (
          <div className="absolute -top-12 left-0 right-0 text-center">
            <span className="bg-red-50 text-red-600 px-3 py-1 rounded-full text-xs border border-red-100 shadow-sm">
              {error}
            </span>
          </div>
        )}

        {/* Suggestion Chips - Only show when not listening and empty */}
        {!input.trim() && !isLoading && !isListening && (
          <div className="flex gap-2 overflow-x-auto pb-3 px-1 no-scrollbar mask-linear-fade">
            {SUGGESTIONS.map(s => (
              <button
                key={s}
                onClick={() => setInput(s)}
                className="whitespace-nowrap px-3 py-1.5 bg-gray-50 text-gray-500 text-xs rounded-full border border-gray-200 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 transition-colors"
              >
                {s}
              </button>
            ))}
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="relative flex items-center">
          {/* Left Icon (Visual only) */}
          <div className="absolute left-3 text-blue-500 pointer-events-none">
            <Sparkles size={18} />
          </div>
          
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={isListening ? "正在听..." : "试着说：刚才打车花了30元..."}
            className={`w-full pl-10 pr-24 py-3.5 rounded-full text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 transition-all ${
              isListening 
                ? 'bg-red-50 ring-2 ring-red-500/30 placeholder-red-400' 
                : 'bg-gray-100 focus:ring-blue-500/50'
            }`}
            disabled={isLoading || isListening}
          />

          <div className="absolute right-2 flex items-center gap-1">
            {/* Mic Button */}
            {isSpeechSupported && (
               <button
               type="button"
               onClick={startListening}
               disabled={isLoading || isListening}
               className={`p-2 rounded-full transition-all duration-200 ${
                 isListening 
                   ? 'text-red-600 bg-red-100 animate-pulse' 
                   : 'text-gray-400 hover:text-gray-600 hover:bg-gray-200'
               }`}
             >
               {isListening ? <MicOff size={18} /> : <Mic size={18} />}
             </button>
            )}

            {/* Send Button */}
            <button
              type="submit"
              disabled={!input.trim() || isLoading || isListening}
              className={`p-2 rounded-full transition-all duration-200 ${
                input.trim() && !isLoading && !isListening
                  ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-md'
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              }`}
            >
              {isLoading ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <ArrowUp size={18} strokeWidth={3} />
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SmartInput;