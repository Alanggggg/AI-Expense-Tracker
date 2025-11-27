
import React, { useState } from 'react';
import { useExpenses } from '../context/ExpenseContext';
import { X, ChevronRight, ChevronDown, Plus, Trash2, FolderOpen } from 'lucide-react';
import { CATEGORY_ICONS, DEFAULT_ICON } from '../constants';

interface SettingsViewProps {
  isOpen: boolean;
  onClose: () => void;
}

const SettingsView: React.FC<SettingsViewProps> = ({ isOpen, onClose }) => {
  const { categoryHierarchy, categoryStyles, registerSubcategory, deleteSubcategory } = useExpenses();
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const [newSubInput, setNewSubInput] = useState<string>('');
  const [addingToCategory, setAddingToCategory] = useState<string | null>(null);

  if (!isOpen) return null;

  const toggleExpand = (category: string) => {
    if (expandedCategory === category) {
      setExpandedCategory(null);
      setAddingToCategory(null);
    } else {
      setExpandedCategory(category);
      setAddingToCategory(null);
    }
  };

  const handleAddSubcategory = (category: string) => {
    if (newSubInput.trim()) {
      registerSubcategory(category, newSubInput.trim());
      setNewSubInput('');
      setAddingToCategory(null);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] bg-white flex flex-col animate-in slide-in-from-right duration-300">
      
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 shrink-0 border-b border-gray-100 bg-white">
        <h2 className="text-xl font-bold text-gray-900">Settings</h2>
        <button onClick={onClose} className="p-2 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors">
          <X size={20} className="text-gray-600" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto bg-gray-50">
        <div className="p-6">
          <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4">Category Management</h3>
          
          <div className="space-y-3">
            {Object.entries(categoryHierarchy).map(([category, subcategories]) => {
              const isExpanded = expandedCategory === category;
              const style = categoryStyles[category] || { colorClass: 'bg-gray-100 text-gray-600' };
              const Icon = CATEGORY_ICONS[category] || DEFAULT_ICON;

              return (
                <div key={category} className="bg-white rounded-xl border border-gray-100 overflow-hidden shadow-sm">
                  {/* Main Category Header */}
                  <div 
                    onClick={() => toggleExpand(category)}
                    className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                       <div className={`p-2 rounded-full ${style.colorClass}`}>
                         <Icon size={18} />
                       </div>
                       <span className="font-semibold text-gray-900">{category}</span>
                       <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                         {subcategories.length}
                       </span>
                    </div>
                    {isExpanded ? <ChevronDown size={18} className="text-gray-400" /> : <ChevronRight size={18} className="text-gray-400" />}
                  </div>

                  {/* Subcategories List */}
                  {isExpanded && (
                    <div className="bg-gray-50/50 border-t border-gray-100">
                      {subcategories.length === 0 && (
                        <div className="p-4 text-sm text-gray-400 text-center italic">
                          No subcategories
                        </div>
                      )}
                      
                      {subcategories.map(sub => (
                        <div key={sub} className="flex items-center justify-between px-4 py-3 border-b border-gray-100 last:border-0 hover:bg-white transition-colors group">
                           <div className="flex items-center gap-2">
                             <div className="w-1.5 h-1.5 rounded-full bg-gray-300"></div>
                             <span className="text-sm text-gray-700">{sub}</span>
                           </div>
                           <button 
                             onClick={(e) => {
                               e.stopPropagation();
                               if(confirm(`Delete subcategory "${sub}"?`)) {
                                 deleteSubcategory(category, sub);
                               }
                             }}
                             className="text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all p-1"
                           >
                             <Trash2 size={14} />
                           </button>
                        </div>
                      ))}

                      {/* Add New Subcategory Input */}
                      <div className="p-3">
                        {addingToCategory === category ? (
                          <div className="flex gap-2">
                            <input 
                              type="text" 
                              autoFocus
                              value={newSubInput}
                              onChange={(e) => setNewSubInput(e.target.value)}
                              placeholder="New subcategory name..."
                              className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') handleAddSubcategory(category);
                                if (e.key === 'Escape') setAddingToCategory(null);
                              }}
                            />
                            <button 
                              onClick={() => handleAddSubcategory(category)}
                              className="bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-700"
                            >
                              <Plus size={16} />
                            </button>
                          </div>
                        ) : (
                          <button 
                            onClick={() => {
                              setAddingToCategory(category);
                              setNewSubInput('');
                            }}
                            className="w-full py-2 flex items-center justify-center gap-2 text-sm text-blue-600 font-medium hover:bg-blue-50 rounded-lg border border-dashed border-blue-200 transition-colors"
                          >
                            <Plus size={14} /> Add Subcategory
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
            
             <div className="text-center mt-6 text-sm text-gray-400">
               <FolderOpen className="mx-auto mb-2 opacity-50" size={32} />
               <p>Main categories are automatically created<br/>when you use them in transactions.</p>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsView;
