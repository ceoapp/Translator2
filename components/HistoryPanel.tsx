import React from 'react';
import { TranslationHistoryItem } from '../types';
import { Clock, Trash2, ArrowRight } from 'lucide-react';

interface HistoryPanelProps {
  history: TranslationHistoryItem[];
  onSelect: (item: TranslationHistoryItem) => void;
  onClear: () => void;
  isOpen: boolean;
  onClose: () => void;
}

export const HistoryPanel: React.FC<HistoryPanelProps> = ({ 
  history, 
  onSelect, 
  onClear,
  isOpen,
  onClose
}) => {
  return (
    <>
      {/* Backdrop for mobile */}
      <div 
        className={`fixed inset-0 bg-black/20 backdrop-blur-sm z-20 transition-opacity duration-300 lg:hidden ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
      />
      
      {/* Panel */}
      <div className={`fixed top-0 right-0 h-full w-80 bg-white shadow-2xl z-30 transform transition-transform duration-300 ease-in-out border-l border-slate-100 ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="flex flex-col h-full">
          <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
            <div className="flex items-center gap-2 text-slate-700">
              <Clock className="w-5 h-5" />
              <h2 className="font-semibold">History</h2>
            </div>
            {history.length > 0 && (
              <button 
                onClick={onClear}
                className="text-xs text-red-500 hover:text-red-600 hover:bg-red-50 px-2 py-1 rounded transition-colors flex items-center gap-1"
              >
                <Trash2 className="w-3 h-3" /> Clear
              </button>
            )}
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {history.length === 0 ? (
              <div className="text-center text-slate-400 mt-10">
                <p>No recent translations</p>
              </div>
            ) : (
              history.map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    onSelect(item);
                    if (window.innerWidth < 1024) onClose();
                  }}
                  className="w-full text-left bg-white border border-slate-200 rounded-lg p-3 hover:border-brand-300 hover:shadow-md transition-all group"
                >
                  <p className="text-sm text-slate-800 font-medium line-clamp-2 mb-1">{item.original}</p>
                  <div className="flex items-center gap-1 text-slate-400">
                    <ArrowRight className="w-3 h-3 min-w-[12px]" />
                  </div>
                  <p className="text-sm text-brand-600 font-thai line-clamp-2 mt-1">{item.translated}</p>
                  <p className="text-[10px] text-slate-400 mt-2 text-right">
                    {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </button>
              ))
            )}
          </div>
        </div>
      </div>
    </>
  );
};