import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HandTracker, HandCoordinates } from './utils/HandTracking';
import { StarDustCanvas } from './components/StarDustCanvas';
import { StarField3D } from './components/StarField3D';
import { CardDeck } from './components/CardDeck';
import { FateTree, FateSession } from './components/FateTree';
import { SpreadDisplay } from './components/SpreadDisplay';
import { SpreadSelector, SPREADS, Spread } from './components/SpreadSelector';
import { getInterpretation, DrawnCard } from './services/tarotService';
import { Sparkles, Save, TreeDeciduous, X, ChevronRight } from 'lucide-react';

type AppState = 'HOME' | 'SPREAD_SELECTION' | 'ASK_QUESTION' | 'DECK' | 'SPREAD_DISPLAY' | 'INTERPRETATION' | 'TREE';

export default function App() {
  const [appState, setAppState] = useState<AppState>('HOME');
  const [question, setQuestion] = useState('');
  const [selectedSpread, setSelectedSpread] = useState<Spread>(SPREADS[0]);
  const [drawnCards, setDrawnCards] = useState<DrawnCard[]>([]);
  
  const [handCoords, setHandCoords] = useState<HandCoordinates | null>(null);
  const [swipeDirection, setSwipeDirection] = useState<'left' | 'right' | 'down' | null>(null);
  const [isFist, setIsFist] = useState(false);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [sessions, setSessions] = useState<FateSession[]>([]);
  const [currentSession, setCurrentSession] = useState<FateSession | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isHoveringSpread, setIsHoveringSpread] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const trackerRef = useRef<HandTracker | null>(null);

  // Preload Images
  useEffect(() => {
    for (let i = 0; i < 78; i++) {
      const img = new Image();
      img.src = `/assets/cards/card_${i}.png`;
    }
  }, []);

  // Load sessions from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('fate_sessions');
    if (saved) {
      setSessions(JSON.parse(saved));
    }
  }, []);

  // Save sessions to localStorage
  useEffect(() => {
    localStorage.setItem('fate_sessions', JSON.stringify(sessions));
  }, [sessions]);

  // Initialize Hand Tracking
  useEffect(() => {
    if ((appState === 'DECK' || appState === 'SPREAD_SELECTION') && !trackerRef.current && videoRef.current) {
      trackerRef.current = new HandTracker(
        (coords) => setHandCoords(coords),
        (dir) => {
          setSwipeDirection(dir);
          setTimeout(() => setSwipeDirection(null), 100); // Reset
        },
        (fist) => setIsFist(fist)
      );
      trackerRef.current.start(videoRef.current).then((success) => {
        setIsCameraActive(success);
      });
    }

    return () => {
      if (appState !== 'DECK' && appState !== 'SPREAD_SELECTION' && trackerRef.current) {
        trackerRef.current.stop();
        trackerRef.current = null;
      }
    };
  }, [appState]);

  // Mouse fallback
  useEffect(() => {
    if (!isCameraActive) {
      const handleMouseMove = (e: MouseEvent) => {
        setHandCoords({ x: e.clientX, y: e.clientY });
      };
      // Removed mouse down/up handlers to prevent auto-selection
      
      window.addEventListener('mousemove', handleMouseMove);
      
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
      };
    }
  }, [isCameraActive]);

  const handleStart = () => {
    setAppState('SPREAD_SELECTION');
  };

  const handleSpreadSelect = (spread: Spread) => {
    setSelectedSpread(spread);
    setAppState('ASK_QUESTION');
  };

  const handleQuestionSubmit = () => {
    if (question.trim()) {
      setDrawnCards([]);
      setAppState('DECK');
    }
  };

  const handleCardSelect = async (cardIndex: number, isReversed: boolean) => {
    const newCard: DrawnCard = {
      index: cardIndex,
      isReversed,
      positionName: selectedSpread.positions[drawnCards.length]
    };
    
    const updatedCards = [...drawnCards, newCard];
    setDrawnCards(updatedCards);

    if (updatedCards.length >= selectedSpread.cardCount) {
      setAppState('SPREAD_DISPLAY');
    }
  };

  const handleInterpret = async () => {
    setIsLoading(true);
    setAppState('INTERPRETATION');
    
    const interpretation = await getInterpretation(question, selectedSpread.name, drawnCards);
    
    const newSession: FateSession = {
      id: Date.now().toString(),
      date: new Date().toISOString(),
      question,
      spreadName: selectedSpread.name,
      cards: drawnCards,
      interpretation,
    };
    
    setCurrentSession(newSession);
    setIsLoading(false);
  };

  const handleSaveSession = () => {
    if (currentSession) {
      setSessions(prev => [...prev, currentSession]);
      setAppState('TREE');
    }
  };

  // Downward swipe to save
  useEffect(() => {
    if (swipeDirection === 'down' && appState === 'INTERPRETATION' && currentSession) {
      handleSaveSession();
    }
  }, [swipeDirection, appState, currentSession]);

  return (
    <div className="min-h-screen bg-transparent text-white font-sans overflow-hidden selection:bg-purple-500/30">
      {/* Hidden video element for MediaPipe */}
      <video ref={videoRef} className="hidden" playsInline />

      {/* 3D Star Field Background */}
      <StarField3D />

      {/* Interactive Particles Overlay */}
      <StarDustCanvas 
        targetCoords={appState === 'SPREAD_SELECTION' && isHoveringSpread ? { x: window.innerWidth / 2, y: window.innerHeight / 2 } : handCoords} 
        isNormalized={appState === 'SPREAD_SELECTION' && isHoveringSpread ? false : isCameraActive} 
        isAttracting={appState === 'SPREAD_SELECTION' && isHoveringSpread}
      />

      {/* Navigation / Header */}
      <header className="fixed top-0 left-0 right-0 p-6 z-50 flex justify-between items-center pointer-events-none">
        <div className="flex items-center gap-3">
          <Sparkles className="w-6 h-6 text-amber-400" />
          <h1 className="text-xl font-serif tracking-widest text-amber-400">命运星尘</h1>
        </div>
        <div className="flex gap-4 pointer-events-auto">
          <button 
            onClick={() => setAppState('TREE')}
            className="p-2 rounded-full bg-purple-900/40 border border-purple-500/30 hover:bg-purple-800/60 transition-colors backdrop-blur-sm"
            title="命运之树"
          >
            <TreeDeciduous className="w-5 h-5 text-amber-400" />
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="relative w-full h-screen flex items-center justify-center pt-20">
        <AnimatePresence mode="wait">
          
          {/* HOME STATE */}
          {appState === 'HOME' && (
            <motion.div 
              key="home"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="flex flex-col items-center max-w-2xl w-full px-6 z-10"
            >
              <div className="w-32 h-32 mb-8 rounded-full bg-gradient-to-br from-purple-900/50 to-indigo-900/50 border border-purple-400/30 flex items-center justify-center shadow-[0_0_40px_rgba(147,51,234,0.4)] backdrop-blur-md">
                <Sparkles className="w-12 h-12 text-amber-300" />
              </div>
              <h2 className="text-4xl font-serif mb-4 text-center text-transparent bg-clip-text bg-gradient-to-r from-amber-200 to-amber-500 drop-shadow-sm">命运星尘</h2>
              <p className="text-purple-200/80 mb-12 text-center text-base font-light tracking-wide">探索未知的指引，倾听星辰的低语。</p>
              
              <button
                onClick={handleStart}
                className="group relative px-12 py-4 rounded-full bg-white/5 border border-white/10 backdrop-blur-md overflow-hidden transition-all hover:bg-white/10 hover:border-white/20 hover:shadow-[0_0_30px_rgba(168,85,247,0.4)]"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-purple-600/20 to-indigo-600/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <span className="relative z-10 text-lg font-serif tracking-[0.2em] text-amber-100 group-hover:text-white transition-colors">开启命运之门</span>
              </button>
            </motion.div>
          )}

          {/* SPREAD SELECTION STATE */}
          {appState === 'SPREAD_SELECTION' && (
            <motion.div 
              key="spread_selection"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="w-full h-full z-10"
            >
              <SpreadSelector 
                onSelect={handleSpreadSelect} 
                swipeDirection={swipeDirection} 
                onHoverChange={setIsHoveringSpread}
              />
            </motion.div>
          )}

          {/* ASK QUESTION STATE */}
          {appState === 'ASK_QUESTION' && (
            <motion.div 
              key="ask_question"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.05 }}
              className="flex flex-col items-center max-w-2xl w-full px-6 z-10"
            >
              <h2 className="text-3xl font-serif mb-2 text-center text-[#f1c40f]">你寻求何种启示？</h2>
              <p className="text-white/60 mb-8 text-center text-sm">已选择：{selectedSpread.name}。请集中精神，输入你的问题。</p>
              
              <input
                type="text"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="例如：我未来的职业发展道路如何？"
                className="w-full bg-[#16213e]/50 border border-[#f1c40f]/30 rounded-xl px-6 py-4 text-lg focus:outline-none focus:border-[#f1c40f] focus:ring-1 focus:ring-[#f1c40f] transition-all placeholder:text-white/20 mb-6 backdrop-blur-sm"
              />
              
              <button
                onClick={handleQuestionSubmit}
                disabled={!question.trim()}
                className="group relative w-full max-w-md py-4 rounded-full bg-white/5 border border-white/10 backdrop-blur-md overflow-hidden transition-all hover:bg-white/10 hover:border-white/20 hover:shadow-[0_0_30px_rgba(241,196,15,0.4)] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-[#e94560]/20 to-[#f1c40f]/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <span className="relative z-10 text-lg font-serif tracking-[0.2em] text-amber-100 group-hover:text-white transition-colors">开始抽牌</span>
              </button>
            </motion.div>
          )}

          {/* DECK STATE */}
          {appState === 'DECK' && (
            <motion.div 
              key="deck"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="w-full h-full z-10 flex flex-col items-center justify-center"
            >
              <div className="absolute top-24 left-1/2 -translate-x-1/2 text-center pointer-events-none z-20">
                <h2 className="text-2xl font-serif text-[#f1c40f] mb-2">抽取第 {drawnCards.length + 1} 张牌</h2>
                <p className="text-white/80 text-sm tracking-widest uppercase">
                  {isCameraActive ? "挥手滑动，握拳选择" : "拖动滑动，点击选择"}
                </p>
                <p className="text-[#e94560] text-xs mt-2">
                  当前位置：{selectedSpread.positions[drawnCards.length]}
                </p>
              </div>
              <CardDeck 
                key={drawnCards.length} 
                onCardSelect={handleCardSelect} 
                swipeDirection={swipeDirection} 
                drawnCardIndices={drawnCards.map(c => c.index)}
                isFist={isFist}
              />
            </motion.div>
          )}

          {/* SPREAD DISPLAY STATE */}
          {appState === 'SPREAD_DISPLAY' && (
            <motion.div 
              key="spread_display"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="w-full h-full z-10 flex flex-col items-center justify-center"
            >
              <div className="absolute top-24 left-1/2 -translate-x-1/2 text-center pointer-events-none z-20">
                <h2 className="text-3xl font-serif text-[#f1c40f] mb-2">{selectedSpread.name}</h2>
                <p className="text-white/60 text-sm">卡牌已就位，命运的轮盘开始转动。</p>
              </div>

              <SpreadDisplay spreadName={selectedSpread.name} cards={drawnCards} />

              <button
                onClick={handleInterpret}
                className="absolute bottom-12 group relative px-12 py-4 rounded-full bg-white/5 border border-white/10 backdrop-blur-md overflow-hidden transition-all hover:bg-white/10 hover:border-white/20 hover:shadow-[0_0_30px_rgba(241,196,15,0.4)] z-20"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-[#e94560]/20 to-[#f1c40f]/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="relative z-10 flex items-center gap-2">
                  <span className="text-lg font-serif tracking-[0.2em] text-amber-100 group-hover:text-white transition-colors">解读命运</span>
                  <ChevronRight className="w-5 h-5 text-amber-100 group-hover:text-white" />
                </div>
              </button>
            </motion.div>
          )}

          {/* INTERPRETATION STATE */}
          {appState === 'INTERPRETATION' && (
            <motion.div 
              key="interpretation"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.05 }}
              className="w-full max-w-3xl max-h-[80vh] overflow-y-auto bg-[#16213e]/80 backdrop-blur-md border border-[#f1c40f]/20 rounded-3xl p-8 z-10 custom-scrollbar"
            >
              {isLoading ? (
                <div className="flex flex-col items-center justify-center h-64 gap-6">
                  <div className="w-12 h-12 border-4 border-[#e94560]/30 border-t-[#f1c40f] rounded-full animate-spin" />
                  <p className="text-[#f1c40f] font-serif italic animate-pulse">正在聆听星辰的低语...</p>
                </div>
              ) : currentSession ? (
                <div className="flex flex-col gap-6">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-2xl font-serif text-[#f1c40f] mb-2">命运的启示</h3>
                      <p className="text-sm text-[#e94560] uppercase tracking-widest">{currentSession.spreadName}</p>
                    </div>
                    <button onClick={() => setAppState('HOME')} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                      <X className="w-6 h-6" />
                    </button>
                  </div>
                  
                  <div className="p-4 rounded-xl bg-black/30 border border-white/5">
                    <p className="text-sm text-white/50 mb-1">你的问题：</p>
                    <p className="text-lg italic">"{currentSession.question}"</p>
                  </div>

                  <div className="prose prose-invert prose-p:text-white/80 prose-p:leading-relaxed max-w-none">
                    {currentSession.interpretation.split('\n').map((paragraph, i) => (
                      <p key={i}>{paragraph}</p>
                    ))}
                  </div>

                  <div className="mt-8 flex justify-center">
                    <button 
                      onClick={handleSaveSession}
                      className="group relative px-8 py-3 rounded-full bg-white/5 border border-white/10 backdrop-blur-md overflow-hidden transition-all hover:bg-white/10 hover:border-white/20 hover:shadow-[0_0_20px_rgba(241,196,15,0.3)]"
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-[#e94560]/10 to-[#f1c40f]/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                      <div className="relative z-10 flex items-center gap-2">
                        <Save className="w-5 h-5 text-amber-100 group-hover:text-white" />
                        <span className="text-base font-serif tracking-wider text-amber-100 group-hover:text-white transition-colors">保存至命运之树</span>
                      </div>
                    </button>
                    <p className="text-xs text-white/30 mt-4 absolute bottom-4">或向下滑动以保存</p>
                  </div>
                </div>
              ) : null}
            </motion.div>
          )}

          {/* TREE STATE */}
          {appState === 'TREE' && (
            <motion.div 
              key="tree"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="w-full h-full z-10 flex flex-col items-center"
            >
              <div className="absolute top-24 left-1/2 -translate-x-1/2 text-center pointer-events-none z-20">
                <h2 className="text-3xl font-serif text-[#f1c40f] mb-2">命运之树</h2>
                <p className="text-white/60 text-sm">你过去的解读已结出果实。</p>
              </div>
              
              <FateTree 
                sessions={sessions} 
                onSelectSession={(session) => {
                  setCurrentSession(session);
                  setAppState('INTERPRETATION');
                }} 
              />

              <button 
                onClick={() => setAppState('HOME')}
                className="absolute bottom-12 group relative px-10 py-4 rounded-full bg-white/5 border border-white/10 backdrop-blur-md overflow-hidden transition-all hover:bg-white/10 hover:border-white/20 hover:shadow-[0_0_30px_rgba(168,85,247,0.4)] z-20"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-purple-600/20 to-indigo-600/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <span className="relative z-10 text-lg font-serif tracking-[0.2em] text-amber-100 group-hover:text-white transition-colors">返回现在</span>
              </button>
            </motion.div>
          )}

        </AnimatePresence>
      </main>
    </div>
  );
}
