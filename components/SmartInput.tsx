
import React, { useState, useEffect, useRef } from 'react';
import { useExpenses } from '../context/ExpenseContext';
import { parseTransactionWithGemini, parseImageTransactionWithGemini } from '../services/geminiService';
import { ArrowUp, Loader2, Sparkles, Mic, Camera, Bot, X } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { Transaction } from '../types';
import EditTransactionModal from './EditTransactionModal';

const SUGGESTIONS = [
  "☕️ 咖啡 25",
  "🚕 打车 30",
  "💰 发工资 8000",
  "📊 上周花了多少钱？"
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
  const { addTransaction, transactions, isLoading, setIsLoading, availableCategories } = useExpenses();
  const [error, setError] = useState<string | null>(null);
  const [aiReply, setAiReply] = useState<string | null>(null); // State for Chat Bubble
  
  // Pending Transaction for Verification
  const [pendingTransaction, setPendingTransaction] = useState<Transaction | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Voice Input State
  const [isListening, setIsListening] = useState(false);
  const [isSpeechSupported, setIsSpeechSupported] = useState(false);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    // 1. Check browser support
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    setIsSpeechSupported(true);

    // 2. iOS Permission Fix
    navigator.mediaDevices.getUserMedia({ audio: true })
      .then((stream) => {
        stream.getTracks().forEach(track => track.stop());
      })
      .catch((err) => {
        console.log("Microphone permission check", err);
      });

    // 3. Initialize SpeechRecognition
    const recognition = new SpeechRecognition();
    recognition.lang = 'zh-CN'; 
    recognition.continuous = true; 
    recognition.interimResults = true; 

    recognition.onstart = () => {
      setIsListening(true);
      setError(null);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.onresult = (event: any) => {
      let finalTranscript = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        } else {
          finalTranscript += event.results[i][0].transcript;
        }
      }
      setInput(finalTranscript);
    };

    recognition.onerror = (event: any) => {
      console.error("Speech recognition error", event.error);
      setIsListening(false);
      if (event.error !== 'aborted' && event.error !== 'not-allowed') {
        setError("无法识别");
      }
    };

    recognitionRef.current = recognition;

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, []);

  const startListening = (e: React.TouchEvent | React.MouseEvent) => {
    if (isLoading) return;
    if (!recognitionRef.current) return;
    // Clear previous reply when starting new interaction
    setAiReply(null); 
    try {
      recognitionRef.current.start();
    } catch (err) {
      console.log("Speech recognition issue", err);
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    setIsLoading(true);
    setError(null);
    setAiReply(null);

    try {
      // Pass transactions history for context-aware Q&A
      const response = await parseTransactionWithGemini(input, availableCategories, transactions);
      
      if (response.action === 'RECORD' && response.transaction) {
        // Instead of adding directly, set as pending for user verification
        setPendingTransaction({
          id: uuidv4(),
          amount: response.transaction.amount,
          category: response.transaction.category,
          note: response.transaction.note,
          date: response.transaction.date,
          type: response.transaction.type
        });
        
      } else if (response.action === 'ANSWER' && response.answerText) {
        setAiReply(response.answerText);
        setInput(''); // Clear input for questions
      }

    } catch (err) {
      setError("无法理解，请重试");
    } finally {
      setIsLoading(false);
    }
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const result = reader.result as string;
        const base64 = result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = error => reject(error);
    });
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    e.target.value = '';
    setIsLoading(true);
    setError(null);
    setAiReply(null);

    try {
      const base64 = await fileToBase64(file);
      const response = await parseImageTransactionWithGemini(base64, file.type, availableCategories);
      
      if (response.action === 'RECORD' && response.transaction) {
         setPendingTransaction({
          id: uuidv4(),
          amount: response.transaction.amount,
          category: response.transaction.category,
          note: response.transaction.note,
          date: response.transaction.date,
          type: response.transaction.type
        });
      }
      
    } catch (err) {
      console.error(err);
      setError("图片识别失败");
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmTransaction = (confirmedTransaction: Transaction) => {
    addTransaction(confirmedTransaction);
    setPendingTransaction(null);
    setInput('');
  };

  return (
    <>
      <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-xl border-t border-gray-100 z-50 px-4 pt-3 pb-[calc(1.0rem+env(safe-area-inset-bottom))] shadow-[0_-4px_20px_rgba(0,0,0,0.03)] h-auto">
        <div className="max-w-md mx-auto relative flex flex-col gap-3">
          {error && (
            <div className="absolute -top-14 left-0 right-0 text-center">
              <span className="bg-red-50 text-red-600 px-3 py-1 rounded-full text-xs border border-red-100 shadow-sm animate-fade-in-up">
                {error}
              </span>
            </div>
          )}

          {/* AI Answer Bubble */}
          {aiReply && (
            <div className="absolute bottom-[4.5rem] left-0 right-0 bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100 rounded-2xl p-4 shadow-lg animate-in slide-in-from-bottom-2 fade-in">
               <div className="flex items-start gap-3">
                  <div className="p-2 bg-blue-100 text-blue-600 rounded-full shrink-0">
                     <Bot size={20} />
                  </div>
                  <div className="flex-1 text-sm text-gray-700 leading-relaxed">
                     {aiReply}
                  </div>
                  <button 
                    onClick={() => setAiReply(null)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X size={16} />
                  </button>
               </div>
            </div>
          )}

          {/* Suggestion Chips - Hide if replying or typing */}
          {!input.trim() && !isLoading && !isListening && !aiReply && (
            <div className="flex gap-2 overflow-x-auto pb-1 px-1 no-scrollbar mask-linear-fade">
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
          
          {/* Input Area + Buttons Layout */}
          <div className="flex items-center gap-3 h-14">
            
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleImageUpload} 
              accept="image/*" 
              className="hidden" 
              capture="environment"
            />
            <button
              type="button"
              onClick={() => !isLoading && fileInputRef.current?.click()}
              disabled={isLoading || isListening}
              className={`flex-shrink-0 w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-200 ${
                isLoading 
                ? 'bg-gray-50 text-gray-300' 
                : 'bg-gray-100 text-gray-500 hover:bg-gray-200 hover:text-gray-700 active:scale-95'
              }`}
            >
              <Camera size={22} />
            </button>

            {/* Text Input */}
            <form onSubmit={handleSubmit} className="relative flex-1 h-full flex items-center m-0">
              <div className="absolute left-3 text-blue-500 pointer-events-none">
                <Sparkles size={18} />
              </div>
              
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={isListening ? "正在聆听..." : isLoading ? "AI 正在思考..." : "记账或提问..."}
                className={`w-full pl-10 pr-12 h-full rounded-2xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all ${
                  isListening 
                    ? 'bg-blue-50/50 ring-2 ring-blue-500/20' 
                    : 'bg-gray-100 border border-transparent focus:bg-white focus:border-blue-200'
                }`}
                disabled={isLoading || isListening}
              />

              <div className={`absolute right-2 transition-all duration-200 transform ${input.trim() ? 'scale-100 opacity-100' : 'scale-90 opacity-0 pointer-events-none'}`}>
                <button
                  type="submit"
                  disabled={!input.trim() || isLoading || isListening}
                  className="p-2 bg-blue-600 text-white rounded-xl shadow-lg shadow-blue-200 hover:bg-blue-700 active:scale-95 transition-all"
                >
                  {isLoading ? (
                    <Loader2 size={18} className="animate-spin" />
                  ) : (
                    <ArrowUp size={18} strokeWidth={3} />
                  )}
                </button>
              </div>
            </form>

            {/* Mic Button */}
            {isSpeechSupported && (
              <button
                type="button"
                onTouchStart={startListening}
                onTouchEnd={stopListening}
                onMouseDown={startListening}
                onMouseUp={stopListening}
                onMouseLeave={stopListening}
                disabled={isLoading}
                className={`flex-shrink-0 w-14 h-full rounded-2xl flex items-center justify-center transition-all duration-200 select-none touch-none ${
                  isListening 
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-300 scale-110' 
                    : 'bg-gray-100 text-gray-500 hover:bg-gray-200 hover:text-gray-700 active:scale-95'
                }`}
                style={{ WebkitTapHighlightColor: 'transparent' }}
              >
                <Mic size={26} className={isListening ? 'animate-pulse' : ''} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      <EditTransactionModal 
        isOpen={!!pendingTransaction}
        transaction={pendingTransaction}
        onClose={() => setPendingTransaction(null)}
        isCreationMode={true}
        onConfirm={handleConfirmTransaction}
      />
    </>
  );
};

export default SmartInput;
