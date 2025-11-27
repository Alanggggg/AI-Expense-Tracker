
import React, { useState } from 'react';
import { ExpenseProvider } from './context/ExpenseContext';
import SummaryCard from './components/SummaryCard';
import TransactionList from './components/TransactionList';
import SmartInput from './components/SmartInput';
import AnalyticsView from './components/AnalyticsView';
import SettingsView from './components/SettingsView';
import { Settings, PieChart } from 'lucide-react';

// Simple container for the "Page" to limit width on desktop
const MobileContainer: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="min-h-screen bg-gray-50 flex justify-center">
      <div className="w-full max-w-md bg-white h-[100dvh] flex flex-col relative shadow-2xl overflow-hidden pt-[env(safe-area-inset-top)]">
        {children}
      </div>
    </div>
  );
};

interface HeaderProps {
  onOpenAnalytics: () => void;
  onOpenSettings: () => void;
}

const Header: React.FC<HeaderProps> = ({ onOpenAnalytics, onOpenSettings }) => {
  return (
    <header className="px-6 py-4 flex justify-between items-center bg-white shrink-0">
      <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
        Overview
      </h1>
      <div className="flex gap-2">
        <button 
          onClick={onOpenAnalytics}
          className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-all"
          title="Analytics"
        >
          <PieChart size={24} />
        </button>
        <button 
          onClick={onOpenSettings}
          className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
          title="Settings"
        >
          <Settings size={24} />
        </button>
      </div>
    </header>
  );
};

const App: React.FC = () => {
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  return (
    <ExpenseProvider>
      <MobileContainer>
        <Header 
          onOpenAnalytics={() => setShowAnalytics(true)} 
          onOpenSettings={() => setShowSettings(true)}
        />
        <div className="flex-1 flex flex-col overflow-hidden relative">
          <SummaryCard />
          <TransactionList />
          {/* Spacer for the fixed bottom input */}
          <div className="h-28 shrink-0" />
        </div>
        <SmartInput />
        
        {/* Full Screen Modals */}
        <AnalyticsView 
          isOpen={showAnalytics} 
          onClose={() => setShowAnalytics(false)} 
        />
        <SettingsView
          isOpen={showSettings}
          onClose={() => setShowSettings(false)}
        />
      </MobileContainer>
    </ExpenseProvider>
  );
};

export default App;
