import React, { useState, useEffect, useRef } from 'react';
import { translateText, generateSpeech } from './services/geminiService';
import { playRawAudio } from './services/audioUtils';
import { LoadingState, TranslationHistoryItem, ToastMessage } from './types';
import { HistoryPanel } from './components/HistoryPanel';
import { 
  ArrowRightLeft, 
  Copy, 
  Volume2, 
  History as HistoryIcon, 
  Sparkles, 
  X,
  Loader2,
  Check
} from 'lucide-react';

const MAX_HISTORY = 50;

function App() {
  // State
  const [inputText, setInputText] = useState('');
  const [outputText, setOutputText] = useState('');
  const [loadingState, setLoadingState] = useState<LoadingState>(LoadingState.IDLE);
  const [history, setHistory] = useState<TranslationHistoryItem[]>(() => {
    try {
      const saved = localStorage.getItem('translation_history');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Debounce ref - using ReturnType<typeof setTimeout> handles both Node and Browser environments gracefully
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load history from local storage
  useEffect(() => {
    localStorage.setItem('translation_history', JSON.stringify(history));
  }, [history]);

  // Toast Helper
  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    const id = Date.now().toString();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3000);
  };

  // Translation Logic
  const handleTranslate = async (text: string) => {
    if (!text.trim()) {
      setOutputText('');
      return;
    }

    setLoadingState(LoadingState.TRANSLATING);
    try {
      const translated = await translateText(text);
      setOutputText(translated);
      
      // Add to history if unique and not empty
      setHistory(prev => {
        // Avoid duplicates at top of list
        if (prev.length > 0 && prev[0].original === text && prev[0].translated === translated) {
          return prev;
        }
        const newItem: TranslationHistoryItem = {
          id: Date.now().toString(),
          original: text,
          translated: translated,
          timestamp: Date.now()
        };
        return [newItem, ...prev].slice(0, MAX_HISTORY);
      });
    } catch (error) {
      console.error(error);
      showToast('Translation failed. Please check your connection.', 'error');
    } finally {
      setLoadingState(LoadingState.IDLE);
    }
  };

  // Debounced Auto-Translate
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value;
    setInputText(text);

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }

    if (text.trim()) {
      // Reduced to 500ms for a more "live" feeling
      debounceTimerRef.current = setTimeout(() => {
        handleTranslate(text);
      }, 500); 
    } else {
      setOutputText('');
    }
  };

  // Manual Translate Trigger
  const handleManualTranslate = () => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }
    handleTranslate(inputText);
  };

  // Text-to-Speech
  const handleSpeak = async (text: string) => {
    if (!text || loadingState === LoadingState.SPEAKING) return;

    setLoadingState(LoadingState.SPEAKING);
    try {
      const audioData = await generateSpeech(text);
      await playRawAudio(audioData);
    } catch (error) {
      console.error(error);
      showToast('Could not play audio.', 'error');
    } finally {
      setLoadingState(LoadingState.IDLE);
    }
  };

  // Copy to Clipboard
  const handleCopy = async (text: string) => {
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      showToast('Copied to clipboard!');
    } catch (err) {
      showToast('Failed to copy', 'error');
    }
  };

  // Clear Input
  const handleClear = () => {
    setInputText('');
    setOutputText('');
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }
  };

  return (
    <div className="relative h-full flex flex-col bg-slate-50 text-slate-900 font-sans">
      
      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between z-10 shadow-sm shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-500 to-brand-600 flex items-center justify-center text-white shadow-brand-200 shadow-lg">
            <span className="font-thai font-bold text-lg">ก</span>
          </div>
          <h1 className="text-xl font-bold tracking-tight text-slate-800">
            Siam<span className="text-brand-600">Speak</span>
          </h1>
        </div>
        <button 
          onClick={() => setIsHistoryOpen(!isHistoryOpen)}
          className={`p-2 rounded-full transition-all ${isHistoryOpen ? 'bg-brand-50 text-brand-600' : 'text-slate-500 hover:bg-slate-100'}`}
          aria-label="Toggle History"
        >
          <HistoryIcon className="w-5 h-5" />
        </button>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col lg:flex-row overflow-hidden relative">
        
        {/* Translation Area */}
        <div className="flex-1 flex flex-col lg:flex-row h-full max-w-7xl mx-auto w-full p-4 lg:p-8 gap-4 lg:gap-8">
          
          {/* Input Card */}
          <div className="flex-1 flex flex-col bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden focus-within:ring-2 focus-within:ring-brand-500/20 focus-within:border-brand-300 transition-all">
            <div className="px-4 py-3 bg-slate-50/50 border-b border-slate-100 flex justify-between items-center shrink-0">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">English</span>
              {inputText && (
                <button onClick={handleClear} className="text-slate-400 hover:text-slate-600 transition-colors">
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
            <textarea
              value={inputText}
              onChange={handleInputChange}
              placeholder="Enter text to translate..."
              className="flex-1 w-full p-5 resize-none outline-none text-lg lg:text-xl text-slate-700 bg-transparent placeholder:text-slate-300 font-sans leading-relaxed"
              spellCheck="false"
            />
            <div className="p-3 flex justify-between items-center gap-2 shrink-0">
              <div className="flex gap-1">
                 {/* Reserved for future English TTS or tools */}
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={() => handleCopy(inputText)}
                  disabled={!inputText}
                  className="p-2 text-slate-400 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition-colors disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-slate-400"
                  title="Copy English text"
                >
                  <Copy className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>

          {/* Desktop Arrow / Mobile Divider */}
          <div className="flex lg:flex-col items-center justify-center shrink-0 z-10">
             <button 
               onClick={handleManualTranslate}
               disabled={!inputText || loadingState === LoadingState.TRANSLATING}
               className="bg-brand-600 hover:bg-brand-700 text-white p-3 rounded-full shadow-lg shadow-brand-500/30 transition-all disabled:opacity-50 disabled:shadow-none hover:scale-105 active:scale-95 group touch-manipulation"
               aria-label="Translate now"
             >
                {loadingState === LoadingState.TRANSLATING ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <ArrowRightLeft className="w-5 h-5 lg:rotate-90 group-hover:rotate-180 lg:group-hover:rotate-90 transition-transform duration-500" />
                )}
             </button>
          </div>

          {/* Output Card */}
          <div className="flex-1 flex flex-col bg-slate-50/50 rounded-2xl shadow-inner border border-slate-200 overflow-hidden relative">
             <div className="px-4 py-3 bg-slate-100/50 border-b border-slate-200/50 flex justify-between items-center shrink-0">
              <span className="text-xs font-semibold uppercase tracking-wider text-brand-600">Thai</span>
              {loadingState === LoadingState.TRANSLATING && (
                <span className="flex items-center gap-1 text-xs text-brand-500 animate-pulse font-medium">
                  <Sparkles className="w-3 h-3" /> Translating...
                </span>
              )}
            </div>
            
            <div className="flex-1 w-full p-5 relative overflow-y-auto custom-scrollbar">
              {outputText ? (
                <p className="text-xl lg:text-2xl text-slate-800 font-thai leading-relaxed break-words">
                  {outputText}
                </p>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-slate-300 select-none pointer-events-none">
                  <span className="font-thai text-5xl mb-3 opacity-20">สวัสดี</span>
                  <p className="text-sm font-medium opacity-60">Translation will appear here</p>
                </div>
              )}
            </div>

            <div className="p-3 flex justify-between items-center border-t border-slate-200/50 bg-white/50 shrink-0">
               <div className="flex gap-1">
                 <button 
                  onClick={() => handleSpeak(outputText)}
                  disabled={!outputText || loadingState === LoadingState.SPEAKING}
                  className={`p-2 rounded-lg transition-colors flex items-center gap-2 ${loadingState === LoadingState.SPEAKING ? 'text-brand-600 bg-brand-50' : 'text-slate-400 hover:text-brand-600 hover:bg-brand-50'}`}
                  title="Listen to translation"
                 >
                   {loadingState === LoadingState.SPEAKING ? <Loader2 className="w-5 h-5 animate-spin" /> : <Volume2 className="w-5 h-5" />}
                 </button>
               </div>
               <div className="flex gap-2">
                 <button 
                  onClick={() => handleCopy(outputText)}
                  disabled={!outputText}
                  className="p-2 text-slate-400 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition-colors disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-slate-400"
                  title="Copy Thai text"
                 >
                   <Copy className="w-5 h-5" />
                 </button>
               </div>
            </div>
          </div>
        </div>

        {/* History Panel */}
        <HistoryPanel 
          isOpen={isHistoryOpen} 
          onClose={() => setIsHistoryOpen(false)}
          history={history}
          onSelect={(item) => {
            setInputText(item.original);
            setOutputText(item.translated);
          }}
          onClear={() => setHistory([])}
        />
      </main>

      {/* Toast Container */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 flex flex-col gap-2 z-50 pointer-events-none w-max max-w-[90vw]">
        {toasts.map(toast => (
          <div 
            key={toast.id}
            className={`
              pointer-events-auto flex items-center gap-2 px-4 py-3 rounded-lg shadow-xl shadow-slate-200/50 text-sm font-medium animate-in slide-in-from-bottom-5 fade-in duration-300
              ${toast.type === 'error' ? 'bg-red-500 text-white' : 'bg-slate-800 text-white'}
            `}
          >
            {toast.type === 'success' && <Check className="w-4 h-4" />}
            {toast.message}
          </div>
        ))}
      </div>

    </div>
  );
}

export default App;