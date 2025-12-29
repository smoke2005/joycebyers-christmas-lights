
import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { ALPHABET_CONFIG } from './constants';
import { getStrangerResponse } from './services/geminiService';
import { audioService } from './services/audioService';
import Bulb from './components/Bulb';

interface HistoryEntry {
  role: 'USER' | 'STRANGER';
  text: string;
  time: string;
}

const App: React.FC = () => {
  const [isDark, setIsDark] = useState(true);
  const [isSoundEnabled, setIsSoundEnabled] = useState(true);
  const [inputValue, setInputValue] = useState('');
  const [paperMessage, setPaperMessage] = useState('R U N');
  const [activeChar, setActiveChar] = useState<string | null>(null);
  const [isTransmitting, setIsTransmitting] = useState(false);
  const [isReceiving, setIsReceiving] = useState(false);
  const [signalStrength, setSignalStrength] = useState('STRONG');
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [showLog, setShowLog] = useState(false);

  const transmissionQueue = useRef<string[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const logEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDark]);

  useEffect(() => {
    audioService.setEnabled(isSoundEnabled);
  }, [isSoundEnabled]);

  useEffect(() => {
    if (activeChar) {
      audioService.playBulbClick();
    }
  }, [activeChar]);

  useEffect(() => {
    if (showLog && logEndRef.current) {
      logEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [showLog, history]);

  const addToHistory = (role: 'USER' | 'STRANGER', text: string) => {
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    setHistory(prev => [...prev, { role, text, time }]);
  };

  const processQueue = useCallback(() => {
    if (transmissionQueue.current.length === 0) {
      setIsTransmitting(false);
      setIsReceiving(false);
      setActiveChar(null);
      return;
    }

    const char = transmissionQueue.current.shift();
    
    if (char !== undefined) {
      setPaperMessage(prev => prev + char);

      if (char === ' ') {
        setActiveChar(null);
        timerRef.current = setTimeout(processQueue, 500);
      } else {
        setActiveChar(char);
        timerRef.current = setTimeout(() => {
          setActiveChar(null);
          timerRef.current = setTimeout(processQueue, 500);
        }, 900);
      }
    }
  }, []);

  const handleTransmit = async () => {
    audioService.resume();
    if (isTransmitting || !inputValue.trim()) return;
    
    const message = inputValue.toUpperCase().replace(/[^A-Z ]/g, '');
    
    addToHistory('USER', message);
    setPaperMessage('');
    setInputValue('');
    setIsTransmitting(true);
    
    audioService.playStaticBurst();
    transmissionQueue.current = message.split('');
    processQueue();

    try {
      setSignalStrength('INTERMITTENT');
      const response = await getStrangerResponse(message);
      
      setTimeout(() => {
        addToHistory('STRANGER', response);
        setIsReceiving(true);
        setPaperMessage(''); 
        setSignalStrength('ANOMALY DETECTED');
        audioService.playIncomingAlert();
        transmissionQueue.current = response.split('');
        processQueue();
      }, (message.length * 1400) + 1000);
    } catch (e) {
      setSignalStrength('STRONG');
    }
  };

  const handleSOS = () => {
    audioService.resume();
    const message = "HELP ME";
    addToHistory('USER', message);
    setPaperMessage('');
    setSignalStrength('CRITICAL');
    audioService.playStaticBurst();
    transmissionQueue.current = message.split('');
    setIsTransmitting(true);
    processQueue();
  };

  const toggleSound = () => {
    const newState = !isSoundEnabled;
    setIsSoundEnabled(newState);
    if (newState) {
      audioService.resume();
    }
  };

  const renderRow = (rowIdx: number) => {
    const letters = ALPHABET_CONFIG.filter(l => l.row === rowIdx);
    return (
      <div className={`grid ${rowIdx === 0 ? 'grid-cols-8' : 'grid-cols-9'} gap-x-2 gap-y-4 relative z-20`}>
        {letters.map((l) => (
          <div key={l.char} className={l.offset}>
            <Bulb 
              char={l.char} 
              color={l.color} 
              isLit={activeChar === l.char} 
            />
          </div>
        ))}
      </div>
    );
  };

  const spores = useMemo(() => {
    return Array.from({ length: 80 }).map((_, i) => ({
      id: i,
      left: `${Math.random() * 100}%`,
      top: `${Math.random() * 100}%`,
      delay: `${Math.random() * 10}s`,
      duration: `${8 + Math.random() * 12}s`,
      size: `${1 + Math.random() * 4}px`,
      opacity: 0.15 + Math.random() * 0.35,
      driftX: `${50 + Math.random() * 200}px`,
      driftY: `${-100 - Math.random() * 200}px`,
    }));
  }, []);

  return (
    <div className="fixed inset-0 wall-texture z-0 overflow-y-auto overflow-x-hidden flex flex-col items-center font-typewriter scroll-smooth transition-all duration-1000 ease-in-out">
      
      {/* Spores Layer */}
      <div className="absolute inset-0 pointer-events-none z-1 overflow-hidden transition-opacity duration-1000 opacity-0 dark:opacity-100">
        {spores.map(s => (
          <div 
            key={s.id} 
            className="spore" 
            style={{ 
              left: s.left, 
              top: s.top, 
              width: s.size,
              height: s.size,
              animation: `float-spore ${s.duration} linear infinite`,
              animationDelay: s.delay,
              '--target-opacity': s.opacity,
              '--drift-x': s.driftX,
              '--drift-y': s.driftY
            } as React.CSSProperties}
          />
        ))}
      </div>

      <div className="fixed inset-0 pointer-events-none opacity-30 bg-[url('https://www.transparenttextures.com/patterns/black-linen.png')] mix-blend-multiply z-1 transition-opacity duration-1000"></div>
      <div className="fixed inset-0 pointer-events-none z-2 bg-[radial-gradient(circle_at_center,_transparent_10%,_rgba(0,0,0,0.8)_100%)] transition-all duration-1000"></div>

      <div className="relative z-10 w-full max-w-md min-h-full flex flex-col shadow-2xl backdrop-blur-[1px] border-x border-black/30 bg-black/5 transition-all duration-1000 ease-in-out">
        
        {/* Header */}
        <header className="pt-10 px-6 pb-2 flex justify-between items-start bg-gradient-to-b from-black/60 via-black/20 to-transparent z-30 shrink-0 transition-colors duration-1000">
          <div className="flex items-start space-x-3">
            <div className="relative mt-2">
              <span className={`material-icons text-red-600 animate-pulse text-2xl drop-shadow-[0_0_8px_rgba(220,38,38,0.8)] transition-all duration-1000`}>
                wifi_tethering
              </span>
            </div>
            <div>
              <h1 className="font-display text-5xl text-red-600 joyce-logo leading-none uppercase transition-all duration-1000">
                JOYCE
              </h1>
              <p className="font-subtitle text-[0.7rem] text-red-500 tracking-[0.4em] uppercase opacity-80 mt-1 pl-1 transition-opacity duration-1000">
                Communication Terminal
              </p>
            </div>
          </div>
          <div className="flex space-x-2">
            <button 
              onClick={() => setShowLog(!showLog)}
              className={`p-2.5 rounded-full bg-stone-200/10 backdrop-blur-md shadow-lg border border-white/10 group hover:bg-stone-200/20 transition-all duration-500 ${showLog ? 'ring-2 ring-red-600/50' : ''}`}
              title="View History"
            >
              <span className={`material-icons text-lg transition-colors ${showLog ? 'text-red-500' : 'text-stone-300'}`}>
                history
              </span>
            </button>
            <button 
              onClick={toggleSound}
              className={`p-2.5 rounded-full backdrop-blur-md shadow-lg border transition-all duration-500 group ${isSoundEnabled ? 'bg-stone-200/10 border-white/10 hover:bg-stone-200/20' : 'bg-red-900/40 border-red-500/30'}`}
              title={isSoundEnabled ? "Mute" : "Unmute"}
            >
              <span className={`material-icons text-lg group-hover:text-white transition-colors ${isSoundEnabled ? 'text-stone-300' : 'text-red-400'}`}>
                {isSoundEnabled ? 'volume_up' : 'volume_off'}
              </span>
            </button>
            <button 
              onClick={() => setIsDark(!isDark)}
              className="p-2.5 rounded-full bg-stone-200/10 backdrop-blur-md shadow-lg border border-white/10 group hover:bg-stone-200/20 transition-all duration-500"
            >
              <span className="material-icons text-stone-300 text-lg group-hover:text-white transition-colors">
                {isDark ? 'light_mode' : 'dark_mode'}
              </span>
            </button>
          </div>
        </header>

        {/* Live Paper Display */}
        <section className="px-6 py-4 z-20 shrink-0 transition-all duration-1000">
          <div className="bg-[#f0e6d2] p-1 shadow-2xl transform rotate-1 relative max-w-[95%] mx-auto transition-all duration-1000 hover:rotate-0 group">
            <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 w-24 h-8 bg-yellow-200/30 rotate-1 backdrop-blur-[1px] shadow-sm border-l border-r border-white/40"></div>
            <div className="border border-stone-400/50 p-4 bg-[url('https://www.transparenttextures.com/patterns/aged-paper.png')] min-h-[100px] flex flex-col">
              <div className="text-[10px] uppercase tracking-[0.3em] text-stone-600 mb-2 font-bold border-b border-stone-400/30 pb-1 flex justify-between items-center">
                <span className={`${isReceiving ? 'text-red-600 animate-pulse' : ''} transition-colors duration-1000`}>Signal: {signalStrength}</span>
                <div className="flex items-center space-x-2">
                  <span className="animate-pulse text-red-600 flex items-center">
                    <span className="w-1.5 h-1.5 bg-red-600 rounded-full mr-1"></span>
                    REC
                  </span>
                </div>
              </div>
              <div className="flex-grow flex items-center justify-center text-center overflow-hidden">
                <p className="font-handwritten text-4xl text-stone-900 tracking-[0.2em] drop-shadow-sm break-all transition-opacity duration-1000">
                  {paperMessage || (isTransmitting ? "" : "...")}
                </p>
              </div>
            </div>
            <div className="absolute bottom-[-4px] left-0 right-0 h-[4px] bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyMCA0IiBwcmVzZXJ2ZUFzcGVjdHJhdGlvPSJub25lIj48cGF0aCBkPSJNIDAgMCBMIDAgNCBMIDIwIDQgTCAyMCAwIFEgMTAgNiAwIDAiIGZpbGw9IiNmMGU2ZDIiLz48L3N2Zz4=')] bg-repeat-x bg-[length:10px_4px] rotate-180"></div>
          </div>
        </section>

        {/* Alphabet Board */}
        <main className="flex-grow relative px-4 py-8 flex flex-col justify-start select-none overflow-visible transition-all duration-1000">
          <svg className="absolute inset-0 w-full h-full pointer-events-none z-10" preserveAspectRatio="none" viewBox="0 0 400 600">
            <path d="M-20,70 C50,120 120,50 180,75 S300,110 420,65" fill="none" stroke="#000" strokeWidth="4" className="wire-path opacity-80" />
            <path d="M-20,210 C60,260 160,200 240,230 S360,250 420,215" fill="none" stroke="#000" strokeWidth="4" className="wire-path opacity-80" />
            <path d="M-20,360 C80,410 200,340 280,380 S380,350 420,370" fill="none" stroke="#000" strokeWidth="4" className="wire-path opacity-80" />
          </svg>

          <div className="space-y-12 mt-2">
            {renderRow(0)}
            <div className="pl-4">{renderRow(1)}</div>
            {renderRow(2)}
          </div>

          {/* Confidential Log Overlay */}
          <div className={`absolute inset-x-0 bottom-0 z-50 transition-all duration-700 ease-[cubic-bezier(0.23,1,0.32,1)] ${showLog ? 'h-[80%] opacity-100 pointer-events-auto' : 'h-0 opacity-0 pointer-events-none'}`}>
            <div className="mx-4 h-full bg-[#e8dab5] rounded-t-3xl shadow-[0_-20px_50px_rgba(0,0,0,0.5)] border-t-2 border-stone-400/30 overflow-hidden flex flex-col relative group">
              <div className="absolute top-0 left-0 right-0 h-10 bg-gradient-to-b from-black/5 to-transparent pointer-events-none"></div>
              
              <div className="px-6 pt-6 pb-2 flex justify-between items-center border-b border-stone-400/40">
                <div>
                  <h2 className="text-xs font-bold text-stone-500 tracking-[0.3em] uppercase">Confidential Archive</h2>
                  <p className="text-[10px] text-stone-400 uppercase mt-0.5">Subject: Anomaly Communications</p>
                </div>
                <button onClick={() => setShowLog(false)} className="text-stone-400 hover:text-red-700 transition-colors">
                  <span className="material-icons">close</span>
                </button>
              </div>

              <div className="flex-grow overflow-y-auto p-6 space-y-4 font-typewriter scroll-smooth">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none opacity-[0.03] select-none rotate-[-15deg]">
                  <h3 className="text-9xl font-bold border-8 border-red-900 text-red-900 p-8 rounded-xl">TOP SECRET</h3>
                </div>

                {history.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-stone-400 opacity-60 italic text-sm">
                    <span className="material-icons text-4xl mb-2">folder_open</span>
                    <p>No recorded activity...</p>
                  </div>
                ) : (
                  history.map((entry, idx) => (
                    <div key={idx} className="border-l-2 border-stone-300 pl-4 py-1">
                      <div className="flex justify-between items-baseline mb-1">
                        <span className={`text-[10px] font-bold tracking-widest ${entry.role === 'USER' ? 'text-stone-500' : 'text-red-800'}`}>
                          [{entry.role === 'USER' ? 'TERMINAL' : 'ANOMALY'}]
                        </span>
                        <span className="text-[9px] text-stone-400 font-sans">{entry.time}</span>
                      </div>
                      <p className={`text-sm leading-relaxed ${entry.role === 'STRANGER' ? 'text-red-900 font-bold' : 'text-stone-800'}`}>
                        {entry.text}
                      </p>
                    </div>
                  ))
                )}
                <div ref={logEndRef} />
              </div>
              
              <div className="p-4 bg-stone-300/20 text-center border-t border-stone-400/20">
                <p className="text-[8px] text-stone-500 tracking-[0.2em] uppercase">Property of HNL • Authorized Personnel Only</p>
              </div>
            </div>
          </div>
        </main>

        {/* Footer Input */}
        <footer className="p-4 z-20 relative shrink-0 transition-all duration-1000">
          <div className="bg-stone-900/90 backdrop-blur-xl rounded-2xl p-5 shadow-2xl border border-white/10 ring-1 ring-black/40 transition-all duration-1000">
            <div className="flex items-center space-x-3 mb-5 border-b border-stone-800 pb-2 transition-colors duration-1000">
              <span className="material-icons text-stone-500 text-xl transition-colors duration-1000">keyboard</span>
              <input 
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value.toUpperCase())}
                disabled={isTransmitting}
                className="flex-grow bg-transparent border-none focus:ring-0 outline-none font-typewriter text-stone-200 placeholder-stone-600 text-sm uppercase tracking-widest disabled:opacity-50 transition-all duration-1000"
                maxLength={25}
                placeholder="TYPE MESSAGE HERE..."
                onKeyDown={(e) => e.key === 'Enter' && handleTransmit()}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <button 
                onClick={handleTransmit}
                disabled={isTransmitting || !inputValue.trim()}
                className="group bg-stone-800 text-stone-300 py-3.5 rounded-xl font-typewriter uppercase tracking-widest text-xs hover:bg-stone-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center space-x-2 shadow-lg border border-stone-700 active:scale-95"
              >
                <span className="material-icons text-sm group-hover:text-white transition-colors">send</span>
                <span>Transmit</span>
              </button>
              <button 
                onClick={handleSOS}
                disabled={isTransmitting}
                className="group bg-red-900/70 text-red-100 py-3.5 rounded-xl font-typewriter uppercase tracking-widest text-xs hover:bg-red-800/80 disabled:opacity-50 transition-all flex items-center justify-center space-x-2 shadow-xl shadow-red-900/20 active:scale-95 border border-red-800/50"
              >
                <span className="material-icons text-sm animate-pulse">warning</span>
                <span>SOS</span>
              </button>
            </div>
          </div>
          <div className="text-center mt-5 mb-2 opacity-40 pb-4 transition-opacity duration-1000">
            <p className="text-[0.6rem] text-stone-400 font-typewriter tracking-[0.3em] uppercase transition-colors duration-1000">
              Hawkins National Laboratory • Dept of Energy
            </p>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default App;
