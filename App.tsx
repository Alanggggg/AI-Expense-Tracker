import React from 'react';
import { ExpenseProvider } from './context/ExpenseContext';
import SummaryCard from './components/SummaryCard';
import TransactionList from './components/TransactionList';
import SmartInput from './components/SmartInput';
import { Settings } from 'lucide-react';

// Simple container for the "Page" to limit width on desktop
// Updated for Capacitor:
// 1. h-[100dvh]: Uses dynamic viewport height for better mobile browser support
// 2. pt-[env(safe-area-inset-top)]: Adds padding for the notch/status bar
const MobileContainer: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="min-h-screen bg-gray-50 flex justify-center">
      <div className="w-full max-w-md bg-white h-[100dvh] flex flex-col relative shadow-2xl overflow-hidden pt-[env(safe-area-inset-top)]">
        {children}
      </div>
    </div>
  );
};

const Header: React.FC = () => {
  return (
    <header className="px-6 py-4 flex justify-between items-center bg-white shrink-0">
      <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
        Overview
      </h1>
      <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors">
        <Settings size={24} />
      </button>
    </header>
  );
};

const App: React.FC = () => {
  return (
    <ExpenseProvider>
      <MobileContainer>
        <Header />
        <div className="flex-1 flex flex-col overflow-hidden relative">
          <SummaryCard />
          <TransactionList />
          {/* Spacer for the fixed bottom input */}
          <div className="h-28 shrink-0" />
        </div>
        <SmartInput />
      </MobileContainer>
    </ExpenseProvider>
  );
};

export default App;